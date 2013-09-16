var gm = require('gm').subClass({ imageMagick: true });
var fs = require('fs');
var commonUtil = require('./common');
var cp = require('child_process');



function cropPic(src){
    this.img_w = 0;
    this.img_h = 0;
    this.img_src = src;         //图片的源地址
    this.img_dst = process.cwd() + '\\images\\';           //图片的目标地址
    this.css_file = 'bg.css';
    this.css_dir = process.cwd() + '\\'+this.css_file;
    this.crop_finish = false;
    this.cssText = '';
}

//获取目录下的文件
cropPic.prototype.getFile = function(dest){
    var results = [],
    files = fs.readdirSync(dest),
    self = this;

    files.forEach(function(file) {
        var pathname = dest  + file,
        stat = fs.lstatSync(pathname)
        if(stat === undefined) return ;

        if(!stat.isDirectory()){
            results.push(pathname);
        }
    });

    return results;
}

//根据图片高度决定切割的高度
cropPic.prototype.cropHeight = function(h){
    var crop_height;
    switch(true){
        case h<=1000 && h>500:
        crop_height = 250;
        break;
        case h>0 && h<500:
        crop_height = 200;
        break;
        default:
        crop_height = 300;
        break;
    }    
    return crop_height;

}



cropPic.prototype.crop = function(dest){
    var img_w,img_h;
    var self = this;

    gm(dest).size(function(err, result){
        if (err) throw err;

        img_w = result.width;
        img_h = result.height;

        var crop_height = self.cropHeight(img_h);
        var reg = /[^\\\/]*[\\\/]+/g; 

        /* 首先匹配非左右斜线字符0或多个，然后是左右斜线一个或者多个。形如“xxx/”或者“xxx\”或者“/”或者“\” */

        var bg_name = dest.replace(reg,'').replace('.jpg','');
        
        var img_crop_num = Math.ceil(img_h/crop_height);
        
        self.cssText += '.' + bg_name + '_bg{width:' + img_w + 'px;height:' + crop_height + 'px;}\n';
        self.cssText += '.' + bg_name + '_bg' + (img_crop_num-1) +'{height:' + (img_h - crop_height*(img_crop_num-1))+'px}\n';
        for(var i = 0;i < img_crop_num;i++){
            var writeStream = fs.createWriteStream(self.img_dst +bg_name+ '_bg'+ i+'.jpg');
            var j = 0;
            
            self.cssText +='.'+bg_name+'_bg'+i+'{background-image:url(images/'+ bg_name+ '_bg'+ i+'.jpg'+')};\n';
            gm(dest)
            .crop(img_w , crop_height , 0 , crop_height*i)
            .quality(85)
            .stream()
            .pipe(writeStream);
            writeStream.on('close', closeCallback);

            function closeCallback(){
                
                j++;
                if(j == img_crop_num){
                    self.cropQuality(self.img_dst);
                }

            }
        }        
        

    });
    
    
    
}

//根据切好的图再判断是否需要再切（todo）
cropPic.prototype.cropQuality = function(dest){
    var files = fs.readdirSync(dest);
    var self = this;
    self.count = 0;
    files.forEach(function(file){
        var pathname = dest + file;
        
        var img_w , img_h;
        gm(pathname).size(function(e,result){
             
            if(e) throw e;
            
            img_w = result.width;
            img_h = result.height;
            gm(pathname).filesize(function(e,size){

                if(e) throw e;
                //将图片大小转为KB
                size = parseInt(size)/1024;
                
                if(size > 100 && size < 200){
                    _crop_by_num(2);
                }
                else if(size > 200 && size < 300){
                    _crop_by_num(3);
                }

                function _crop_by_num(n){
                    var src = pathname.replace('.jpg','');
                    var reg = /[^\\\/]*[\\\/]+/g; 
                    var bg_name = src.replace(reg,'').replace('.jpg','');
                    self.cssText += '.'+bg_name+'_bg{height:'+ parseInt(img_h/n) +'px};\n';
                    self.cssText += '.'+bg_name+'_bg'+(n-1)+'{height:'+ (img_h-parseInt(img_h/n)*(n-1)) +'px};\n';
                    
                        
                       
                     for(var i = 0;i < n;i++){   
                        var ws = fs.createWriteStream(src +'_'+ i +'.jpg');
                        
                        self.cssText += '.'+bg_name+'_bg'+i+'{background-image:url(images/'+ bg_name+ '_'+ i+'.jpg'+')};\n';

                        gm(pathname)
                        .crop(img_w , parseInt(img_h/n) , 0 ,parseInt(img_h/n)*i)
                        .quality(85)
                        .stream()
                        .pipe(ws);

                    }
                    
                    
                }
                self.count++;
            
                if(self.count == files.length){
                    
                    self.writeStyle(self.cssText);
                    console.log('done!');
                }  
               
            })
            
        
              
        });
    })

}
//写入样式表文件
cropPic.prototype.writeStyle = function(string){

    fs.open(this.css_file,"a",0644,function(e,fd){
        if(e) throw e;
        fs.write(fd,string,0,'utf8',function(e){
            if(e) throw e;
            fs.closeSync(fd);
        })
    })
}

cropPic.prototype.run = function(){

    try{
        var stat = fs.statSync(this.css_dir);
        
        if(stat.isFile()){
            fs.unlinkSync(this.css_dir);
        }  
    }
    catch(e){
        console.log('bg.css will be created  :P !');
    }

    commonUtil.rmdirSync("images",function(e){
        console.log('doing......');
    })
    commonUtil.mkdirSync("images", 0,function(e){
        
        if(e){
            console.log('images will be created :P !');

        }
        
    });

    var self = this;
    var todoArray = this.getFile(this.img_src);
    todoArray.forEach(function(dest){
        self.crop(dest);
    })




    
}
module.exports = cropPic;