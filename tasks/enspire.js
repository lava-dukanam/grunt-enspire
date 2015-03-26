/*
 * grunt-enspire
 * https://github.com/jasonfutch/grunt-enspire
 *
 * Copyright (c) 2015 jasonfutch
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerTask('enspire','A plugin for specific use within Enspire Commerce.', function(arg1, arg2) {
        grunt.loadNpmTasks('grunt-contrib-symlink');
        grunt.loadNpmTasks("grunt-extend-config");
        grunt.loadNpmTasks("grunt-contrib-concat");
        grunt.loadNpmTasks('grunt-contrib-clean');
        grunt.loadNpmTasks("grunt-contrib-sass");
        grunt.loadNpmTasks('grunt-html-build');
        grunt.loadNpmTasks('grunt-autoprefixer');

        // Holds platform.json config
        var objPlatform;

        // Holds required dependencies
        var required = {
            modules:[],
            views:[],
            bower:[]
        };

        var viewFiles = [];
        var jsFiles = [];
        var fontFiles = [];
        var js = [];
        var css = [];
        var scss = [];
        var fonts = [];

        if(grunt.option('commands')){
            grunt.log.writeln('\nOptions:');
            grunt.log.writeln('\t--init \t\t\t Creates an empty platform.json file');
            grunt.log.writeln('\t--init-force \t\t Overwrites platform.json with an empty file');
            grunt.log.writeln('\t--init-bower \t\t Creates a default .browerrc file');
            grunt.log.writeln('\t--init-bower-force \t Overwrites a .browerrc with a default file');
            grunt.log.writeln('\t--theme \t\t Defines the theme to use, instead of the one defined in platform.json');
            return true;
        }

        //Create platform.json
        if(grunt.option('init') || grunt.option('init-force')){
            if(grunt.file.exists('platform.json') && !grunt.option('init-force')){
                grunt.log.error('"platform.json" already exists, to overwrite run "grunt enspire --init-force" command');
                return false;
            }
            grunt.file.write('platform.json','{\n\t"theme":"",\n\t"modules":[],\n\t"views":[],\n\t"includes":{\n\t\t"js":[],\n\t\t"css":[],\n\t\t"scss":[]\n\t}\n}');
            return true;
        }

        //Create .bowerrc
        if(grunt.option('init') || grunt.option('init-bower')){
            if(grunt.file.exists('.bowerrc') && !grunt.option('init-bower-force')){
                grunt.log.error('".bowerrc" already exists, to overwrite run "grunt enspire --init-bower-force" command');
                return false;
            }
            grunt.file.write('.bowerrc','{\n\t"directory":"bower_components",\n\t"json":"bower.json"\n}');
            return true;
        }

        if(!grunt.file.exists('platform.json')){
            grunt.log.error('"platform.json" is a required file and must be in the root directory. To create an empty one run "grunt enspire --init" command');
            return false;
        }

        objPlatform = grunt.file.readJSON('platform.json');

        if(objPlatform.bower_directory===undefined){
            if(!grunt.file.exists('.bowerrc')){
                grunt.log.error('".bowerrc" file is a required if bower_directory is not defined in "platform.json". To create a default one run "grunt enspire --init-bower" command');
                return false;
            }

            var bowerrc = grunt.file.readJSON('.bowerrc');
            objPlatform.bower_directory = bowerrc.directory;
        }

        if(!grunt.file.exists(objPlatform.bower_directory)){
            grunt.log.error('"'+objPlatform.bower_directory+'" directory was not found, try running "bower install" command.');
            return false;
        }

        if(!grunt.file.exists(objPlatform.bower_directory+'/enspire.platform/')){
            grunt.log.error('"enspire.platform" folder was not found in your '+objPlatform.bower_directory+' directory.');
            return false;
        }

        if(grunt.option('theme')!==undefined){
            if(grunt.option('theme')===0){
                grunt.log.error('"--themes" option can not be blank, it must have a value. ex: "--theme=myThemeName"');
                return false;
            }
            if(grunt.option('theme')===0 || grunt.option('theme')===true){
                grunt.log.error('"--themes" must have a value defined. ex: "--theme=myThemeName"');
                return false;
            }
            objPlatform.theme = grunt.option('theme');
        }

        grunt.extendConfig({
            clean:{
                dev:["dev"],
                after:[".sass-cache","_temp-grunt"]
            }
        });

        grunt.task.run('clean:dev');

        var themeFiles = [];
        if(objPlatform.ui!==undefined && objPlatform.ui !== ''){
            if((objPlatform.theme===undefined || objPlatform.theme==='')){
                if(objPlatform.theme===undefined) grunt.log.warn('"theme" is undefined in the "platform.json" file');
                if(objPlatform.theme==='') grunt.log.warn('"theme" is blank in the "platform.json" file');
            }else{
                var folderThemes = objPlatform.bower_directory+'/enspire.platform/themes/';

                if(!grunt.file.exists(folderThemes)){
                    grunt.log.error('"themes" folder is missing from "'+objPlatform.bower_directory+'/enspire.platform" directory.');
                    return false;
                }

                var themeFolder = objPlatform.bower_directory+'/enspire.platform/themes/'+objPlatform.theme+'/';
                if(!grunt.file.exists(themeFolder)){
                    grunt.log.error('"'+objPlatform.theme+'" theme does not exist in "'+folderThemes+'" directory.');
                    return false;
                }

                grunt.file.recurse(themeFolder, function callback(abspath, rootdir, subdir, filename){
                    //if(filename!==undefined && (filename.indexOf('.scss', filename.length - 5) !== -1 || filename.indexOf('.sass', filename.length - 5) !== -1)) themeFiles.push(abspath);
                });
            }

            switch(objPlatform.ui){
                case 'enspire.ui':
                    if(!grunt.file.exists(objPlatform.bower_directory+'/enspire.ui/')){
                        grunt.log.error('"enspire.ui" folder was not found in your '+objPlatform.bower_directory+' directory.');
                        return false;
                    }

                    var uiConfig = objPlatform.bower_directory+'/enspire.ui/.enspirerc';
                    if(!grunt.file.exists(uiConfig)){
                        grunt.log.error('".enspirerc" file is missing from the root of '+objPlatform.bower_directory+'/enspire.ui/ directory');
                        return false;
                    }

                    var objUiConfig = grunt.file.readJSON(uiConfig);

                    if(objUiConfig.scss !== undefined){
                        if(!Array.isArray(objUiConfig.scss)){
                            grunt.log.error('"'+uiConfig+'" scss property must be in an array format.');
                            return false;
                        }

                        var lngScss = objUiConfig.scss.length;
                        var themeInsertLocation = 0;
                        for(var i=0; i<lngScss; i++){
                            if(objUiConfig.scss[i] === '{% _THEME_ %}'){
                                themeInsertLocation = i;
                            }else{
                                if(objUiConfig.scss[i].substring(1,0)==='!'){
                                    objUiConfig.scss[i] = '!'+objPlatform.bower_directory+'/enspire.ui/'+objUiConfig.scss[i].substring(1);
                                }else{
                                    objUiConfig.scss[i] = objPlatform.bower_directory+'/enspire.ui/'+objUiConfig.scss[i];
                                }
                            }
                        }
                        var args = [themeInsertLocation, 1].concat(themeFiles);
                        Array.prototype.splice.apply(objUiConfig.scss, args);

                        grunt.extendConfig({
                            concat:{
                                ui: {
                                    src: objUiConfig.scss,
                                    dest: "_temp-grunt/ui.scss"
                                }
                            },
                            sass:{
                                ui: {
                                    files: {
                                        "dev/assets/css/ui.css": "_temp-grunt/ui.scss"
                                    }
                                }
                            },
                            autoprefixer: {
                                options: {
                                    browsers: ['last 2 versions', 'last 4 Android versions', 'Explorer >= 9']
                                },
                                ui:{
                                   src: "dev/assets/css/ui.css"
                                }
                            }
                        });

                        grunt.task.run('concat:ui');
                        grunt.task.run('sass:ui');
                        grunt.task.run('autoprefixer:ui');
                    }

                    if(objUiConfig.js !== undefined) {
                        var lngJs = objUiConfig.js.length;
                        for(var i=0; i<lngJs; i++){
                            if(objUiConfig.js[i].substring(1,0)==='!'){
                                objUiConfig.js[i] = '!'+objPlatform.bower_directory+'/enspire.ui/'+objUiConfig.js[i].substring(1);
                            }else{
                                objUiConfig.js[i] = objPlatform.bower_directory+'/enspire.ui/'+objUiConfig.js[i];
                            }
                        }
                        js = js.concat(objUiConfig.js);
                    }

                    if(objUiConfig.fonts !== undefined) {
                        var lngFonts = objUiConfig.fonts.length;
                        for(var i=0; i<lngFonts; i++){
                            if(objUiConfig.fonts[i].substring(1,0)==='!'){
                                objUiConfig.fonts[i] = '!'+objPlatform.bower_directory+'/enspire.ui/'+objUiConfig.fonts[i].substring(1);
                            }else{
                                objUiConfig.fonts[i] = objPlatform.bower_directory+'/enspire.ui/'+objUiConfig.fonts[i];
                            }
                        }
                        fonts = fonts.concat(objUiConfig.fonts);

                        var aryFontsFiles = grunt.file.expand(objUiConfig.fonts);
                        var lngFontFiles = aryFontsFiles.length;
                        for(var i=0; i<lngFontFiles; i++){
                            fontFiles.push({
                                overwrite: false,
                                src: [aryFontsFiles[i]],
                                dest: 'dev/assets/css/fonts/'+(aryFontsFiles[i].replace(objPlatform.bower_directory+'/enspire.ui/src/fonts/',''))
                            });
                        }
                    }
                    break;
                case 'ionic':
                    break;
            }
        }else{
            grunt.log.writeln('This project is using a custom UI, as no UI framework has been defined.');
        }

        if(objPlatform.modules!==undefined){
            if(!Array.isArray(objPlatform.modules)){
                grunt.log.error('"modules" must be an array in the "platform.json" file');
                return false;
            }

            var folderModules = objPlatform.bower_directory+'/enspire.platform/modules/';
            if(!grunt.file.exists(folderModules)){
                grunt.log.error('"modules" folder is missing from "'+folderModules+'" directory.');
                return false;
            }

            var lngModules = objPlatform.modules.length;
            for(var i=0;i<lngModules;i++){
                var moduleName = objPlatform.modules[i];
                var moduleFolder = folderModules+moduleName+'/';

                if(moduleName===''){
                    grunt.log.error('"'+moduleName+'" module does not exist in "'+folderModules+'" directory. Please remove the empty string from your array in "modules" property of your "plaform.json" file.');
                    return false;
                }

                if(!grunt.file.exists(moduleFolder)){
                    grunt.log.error('"'+moduleName+'" module does not exist in "'+folderModules+'" directory.');
                    return false;
                }else{
                    var moduleConfig = moduleFolder+'.enspirerc';
                    if(grunt.file.exists(moduleConfig)){
                        var objModuleConfig = grunt.file.readJSON(moduleConfig);

                        if(objModuleConfig.dependencies!==undefined){
                            if(objModuleConfig.dependencies.modules!==undefined){
                                if(!Array.isArray(objModuleConfig.dependencies.modules)){
                                    grunt.log.error('"'+moduleConfig+'" dependencies.module property must be in an array format.');
                                    return false;
                                }

                                var lngModulesDependencyModules = objModuleConfig.dependencies.modules.length;
                                for(var x=0; x<lngModulesDependencyModules; x++){
                                    var ModulesDependencyModule = objModuleConfig.dependencies.modules[x];
                                    if(required.modules.indexOf(ModulesDependencyModule) === -1 && objPlatform.modules.indexOf(ModulesDependencyModule) === -1){
                                        required.modules.push(ModulesDependencyModule);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if(objPlatform.views!==undefined){
            if(!Array.isArray(objPlatform.views)){
                grunt.log.error('"views" must be an array in the "platform.json" file');
                return false;
            }

            if(!grunt.file.exists(objPlatform.bower_directory+'/enspire.platform/views/')){
                grunt.log.error('"views" folder is missing from "'+objPlatform.bower_directory+'/enspire.platform" directory.');
                return false;
            }

            var lngViews = objPlatform.views.length;
            var cwdViews = objPlatform.bower_directory+'/enspire.platform/views/';
            for(var i=0;i<lngViews;i++){
                var viewsFolder = cwdViews+objPlatform.views[i];
                if(!grunt.file.isDir(viewsFolder)){
                    grunt.log.warn('"'+objPlatform.views[i]+'" folder exist in "'+objPlatform.bower_directory+'/enspire.platform/views/" directory.');
                }else{
                    var aryFoundFolders = [];

                    //Get View Screens
                    viewFiles = viewFiles.concat(processViews(viewsFolder,'screens'));

                    //Get View Includes
                    viewFiles = viewFiles.concat(processViews(viewsFolder,'includes'));

                    //Get View Modals
                    viewFiles = viewFiles.concat(processViews(viewsFolder,'modals'));

                }
            }
        }

        if(objPlatform.includes!==undefined){
            if(objPlatform.includes.js!==undefined){
                var lngJS = objPlatform.includes.js.length;
                for(var i=0;i<lngJS;i++){
                    var aryFiles = grunt.file.expand(objPlatform.includes.js[i]);
                    if(aryFiles.length===0){
                        grunt.log.warn('"'+objPlatform.includes.js[i]+'" does not return any files.');
                    }else{
                        var hasJS = false;
                        for(var x=0;x<aryFiles.length;x++){
                            if(aryFiles[x].indexOf('.js', aryFiles[x].length - 3) !== -1) hasJS = true;
                        }
                        if(hasJS===false){
                            grunt.log.warn('"'+objPlatform.includes.js[i]+'" does not return any *.js files.');
                        }
                    }
                }
            }

            if(objPlatform.includes.css!==undefined){
                var lngCSS = objPlatform.includes.css.length;
                for(var i=0;i<lngCSS;i++){
                    var aryFiles = grunt.file.expand(objPlatform.includes.css[i]);
                    if(aryFiles.length===0){
                        grunt.log.warn('"'+objPlatform.includes.css[i]+'" does not return any files.');
                    }else{
                        var hasCSS = false;
                        for(var x=0;x<aryFiles.length;x++){
                            if(aryFiles[x].indexOf('.css', aryFiles[x].length - 4) !== -1) hasCSS = true;
                        }
                        if(hasCSS===false){
                            grunt.log.warn('"'+objPlatform.includes.css[i]+'" does not return any *.css files.');
                        }
                    }
                }
            }

            if(objPlatform.includes.scss!==undefined){
                var lngSCSS = objPlatform.includes.scss.length;
                for(var i=0;i<lngSCSS;i++){
                    var aryFiles = grunt.file.expand(objPlatform.includes.scss[i]);
                    if(aryFiles.length===0){
                        grunt.log.warn('"'+objPlatform.includes.scss[i]+'" does not return any files.');
                    }else{
                        var hasSCSS = false;
                        for(var x=0;x<aryFiles.length;x++){
                            if(aryFiles[x].indexOf('.scss', aryFiles[x].length - 5) !== -1) hasSCSS = true;
                            if(aryFiles[x].indexOf('.sass', aryFiles[x].length - 5) !== -1) hasSCSS = true;
                        }
                        if(hasSCSS===false){
                            grunt.log.warn('"'+objPlatform.includes.scss[i]+'" does not return any *.scss or *.sass files.');
                        }
                    }
                }
            }
        }

        if(!grunt.file.exists('src')){
            grunt.log.error('"src" folder is missing from root directory, try running "yo enspire" to setup scaffolding.');
            return false;
        }

        if(!grunt.file.exists('src/js')){
            grunt.log.error('"js" folder was not found in your "src" directory.');
        }
        if(!grunt.file.exists('src/styles')){
            grunt.log.error('"styles" folder was not found in your "src" directory.');
        }

        if(!grunt.file.exists('src/views')){
            grunt.log.error('"views" folder was not found in your "src" directory.');
        }else{
            //Get View Screens
            viewFiles = viewFiles.concat(processViews('src/views','screens'));

            //Get View Includes
            viewFiles = viewFiles.concat(processViews('src/views','includes'));

            //Get View Modals
            viewFiles = viewFiles.concat(processViews('src/views','modals'));
        }

        if(!grunt.file.exists('src/index.html')){
            grunt.log.error('"index.html" missing from your "src" directory.');
            return false;
        }

        grunt.extendConfig({
            htmlbuild:{
                index: {
                    src: 'src/index.html',
                    dest: 'dev',
                    options: {
                        beautify: true,
                        relative: true,
                        scripts: {
                            bundle: objPlatform.includes.js.concat(js).concat(['src/js/**/*.js'])
                        },
                        styles: {
                            bundle: ['dev/assets/css/ui.css']
                        }
                    }
                }
            },
            symlink:{
                views: {
                    files: viewFiles
                },
                js:{
                    files: jsFiles
                },
                fonts:{
                    files: fontFiles
                }
            }
        });

        grunt.task.run('symlink:views');
        grunt.task.run('symlink:fonts');
        grunt.task.run('htmlbuild:index');
        grunt.task.run('clean:after');

    });


    function processViews(dir,type){
        var viewFiles = [];
        var viewsFolder = dir + '/'+type;
        if(grunt.file.exists(viewsFolder)) {
            var aryFoundFolders = [];
            grunt.file.recurse(viewsFolder, function callback(abspath, rootdir, subdir, filename) {
                if (subdir !== undefined) {
                    var arySubFolderName = subdir.split('/');
                    if (aryFoundFolders.indexOf(arySubFolderName[0]) === -1) {
                        aryFoundFolders.push(arySubFolderName[0]);
                        viewFiles.push({
                            expand: true,
                            overwrite: false,
                            cwd: viewsFolder,
                            src: ['*'],
                            dest: 'dev/views/'+type,
                            filter: 'isDirectory'
                        });
                    }
                } else {
                    viewFiles.push({
                        expand: true,
                        overwrite: false,
                        cwd: viewsFolder,
                        src: [filename],
                        dest: 'dev/views/'+type+'/'
                    });
                }
            });
        }
        return viewFiles;
    }

    function processJS(){

    }

};
