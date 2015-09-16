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
        grunt.loadNpmTasks('grunt-contrib-cssmin');
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-copy');
        grunt.loadNpmTasks('grunt-contrib-clean');
        grunt.loadNpmTasks('grunt-ng-annotate');
        grunt.loadNpmTasks("grunt-contrib-sass");
        grunt.loadNpmTasks('grunt-html-build');
        grunt.loadNpmTasks('grunt-autoprefixer');
        grunt.loadNpmTasks('grunt-angular-templates');

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
        var imageFiles = [];
        var copyFiles = [];
        var ng_templates = [];
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
                dist:["dist"],
                after:[".sass-cache","_temp-grunt"]
            }
        });

        grunt.task.run('clean:dev');
        grunt.task.run('clean:dist');

        var themeScssFiles = [];
        var themeScssOtherFiles = [];
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

                var themeFolder = objPlatform.bower_directory+'/enspire.platform/themes/'+objPlatform.theme+'/'+objPlatform.ui+'/';
                if(!grunt.file.exists(themeFolder)){
                    grunt.log.error('"'+objPlatform.theme+'" theme does not exist for '+objPlatform.ui+' in "'+folderThemes+'" directory.');
                    return false;
                }

                var themeConfig = themeFolder+'.enspirerc';
                if(grunt.file.exists(themeConfig)){
                    var objThemeConfig = grunt.file.readJSON(themeConfig);

                    if(objThemeConfig.scss !== undefined){
                        var aryThemeScssFiles = grunt.file.expand({cwd:themeFolder},objThemeConfig.scss);
                        var lngThemeScssFiles = aryThemeScssFiles.length;
                        for(var i=0; i<lngThemeScssFiles; i++){
                            if(aryThemeScssFiles[i].indexOf('theme.scss') !== -1 || aryThemeScssFiles[i].indexOf('theme.sass') !== -1){
                                themeScssFiles.push(themeFolder+aryThemeScssFiles[i]);
                            }else{
                                themeScssOtherFiles.push(themeFolder+aryThemeScssFiles[i]);
                            }
                        }
                    }

                    if(objThemeConfig.images !== undefined){
                        var aryThemeImageFiles = grunt.file.expand({cwd:themeFolder},objThemeConfig.images);

                        var lngThemeImageFiles = aryThemeImageFiles.length;
                        for(var i=0; i<lngThemeImageFiles; i++){
                            imageFiles.push({
                                "overwrite": false,
                                "src": [themeFolder+aryThemeImageFiles[i]],
                                "dest": 'dev/assets/images/'
                            });
                            copyFiles.push({
                                "expand":true,
                                "cwd":themeFolder,
                                "src": [aryThemeImageFiles[i]],
                                "dest": 'dist/assets/'
                            });
                        }
                    }

                }else{
                    grunt.file.recurse(themeFolder, function callback(abspath, rootdir, subdir, filename){
                        if(filename!==undefined && (filename.indexOf('.scss', filename.length - 5) !== -1 || filename.indexOf('.sass', filename.length - 5) !== -1)){
                            if(filename.indexOf('theme.scss') !== -1 || filename.indexOf('theme.sass') !== -1){
                                themeScssFiles.push(abspath);
                            }else{
                                themeScssOtherFiles.push(abspath);
                            }
                        }
                    });
                }
            }


            if(!grunt.file.exists(objPlatform.bower_directory+'/'+objPlatform.ui+'/')){
                grunt.log.error('"'+objPlatform.ui+'" folder was not found in your '+objPlatform.bower_directory+' directory.');
                return false;
            }

            var uiConfig = objPlatform.bower_directory+'/'+objPlatform.ui+'/.enspirerc';
            if(!grunt.file.exists(uiConfig)){
                grunt.log.error('".enspirerc" file is missing from the root of '+objPlatform.bower_directory+'/'+objPlatform.ui+'/ directory');
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
                var bolThemeInsertFound = false;
                for(var i=0; i<lngScss; i++){
                    if(objUiConfig.scss[i] === '{% _THEME_ %}'){
                        themeInsertLocation = i;
                        bolThemeInsertFound = true;
                    }else{
                        if(objUiConfig.scss[i].substring(1,0)==='!'){
                            objUiConfig.scss[i] = '!'+objPlatform.bower_directory+'/'+objPlatform.ui+'/'+objUiConfig.scss[i].substring(1);
                        }else{
                            objUiConfig.scss[i] = objPlatform.bower_directory+'/'+objPlatform.ui+'/'+objUiConfig.scss[i];
                        }
                    }
                }

                if(bolThemeInsertFound){
                    var args = [themeInsertLocation, 1].concat(themeScssFiles);
                    Array.prototype.splice.apply(objUiConfig.scss, args);
                }

                objUiConfig.scss = objUiConfig.scss.concat(themeScssOtherFiles);

                switch(objPlatform.ui){
                    case 'enspire.ui':
                        grunt.extendConfig({
                            concat:{
                                ui: {
                                    src: objUiConfig.scss,
                                    dest: "_temp-grunt/ui.scss"
                                }
                            },
                            sass:{
                                dev: {
                                    files: {
                                        "dev/assets/css/ui.css": "_temp-grunt/ui.scss"
                                    }
                                },
                                dist: {
                                    files: {
                                        "_temp-grunt/ui.css": "_temp-grunt/ui.scss"
                                    }
                                }
                            }
                        });

                        break;
                    case 'ionic':
                        grunt.extendConfig({
                            concat:{
                                ui: {
                                    src: objUiConfig.scss,
                                    dest: objPlatform.bower_directory+'/'+objPlatform.ui+'/scss/ui.scss'
                                }
                            },
                            sass:{
                                dev: {
                                    files: {
                                        "dev/assets/css/ui.css": objPlatform.bower_directory+'/'+objPlatform.ui+'/scss/ui.scss'
                                    }
                                },
                                dist: {
                                    files: {
                                        "_temp-grunt/ui.css": objPlatform.bower_directory+'/'+objPlatform.ui+'/scss/ui.scss'
                                    }
                                }
                            }
                        });
                        break;
                }
                grunt.extendConfig({
                    autoprefixer: {
                        options: {
                            browsers: ['last 2 versions', 'last 4 Android versions', 'Explorer >= 9']
                        },
                        dev:{
                            src: "dev/assets/css/ui.css"
                        },
                        dist:{
                            src: "_temp-grunt/ui.css"
                        }
                    }
                });
                grunt.task.run('concat:ui');
                grunt.task.run('sass:dev');
                grunt.task.run('sass:dist');
                grunt.task.run('autoprefixer:dev');
                grunt.task.run('autoprefixer:dist');
            }

            if(objUiConfig.js !== undefined) {
                if(!Array.isArray(objUiConfig.js)){
                    grunt.log.error('"'+uiConfig+'" js property must be in an array format.');
                    return false;
                }

                var lngJs = objUiConfig.js.length;
                for(var i=0; i<lngJs; i++){
                    if(objUiConfig.js[i].substring(1,0)==='!'){
                        objUiConfig.js[i] = '!'+objPlatform.bower_directory+'/'+objPlatform.ui+'/'+objUiConfig.js[i].substring(1);
                    }else{
                        objUiConfig.js[i] = objPlatform.bower_directory+'/'+objPlatform.ui+'/'+objUiConfig.js[i];
                    }
                }
                js = js.concat(objUiConfig.js);
            }

            if(objUiConfig.fonts !== undefined) {
                if(!Array.isArray(objUiConfig.fonts)){
                    grunt.log.error('"'+uiConfig+'" fonts property must be in an array format.');
                    return false;
                }

                var lngFonts = objUiConfig.fonts.length;
                for(var i=0; i<lngFonts; i++){
                    if(objUiConfig.fonts[i].substring(1,0)==='!'){
                        objUiConfig.fonts[i] = '!'+objPlatform.bower_directory+'/'+objPlatform.ui+'/'+objUiConfig.fonts[i].substring(1);
                    }else{
                        objUiConfig.fonts[i] = objPlatform.bower_directory+'/'+objPlatform.ui+'/'+objUiConfig.fonts[i];
                    }
                }
                fonts = fonts.concat(objUiConfig.fonts);

                var aryFontsFiles = grunt.file.expand(objUiConfig.fonts);
                var lngFontFiles = aryFontsFiles.length;
                for(var i=0; i<lngFontFiles; i++){
                    //VERY NASTY WAY OF DOING IT< BUT RAN OUT OF TIME.
                    if(objPlatform.ui === 'enspire.ui'){
                        fontFiles.push({
                            "overwrite": false,
                            "src": [aryFontsFiles[i]],
                            "dest": 'dev/assets/css/fonts/'+(aryFontsFiles[i].replace(objPlatform.bower_directory+'/'+objPlatform.ui+'/src/fonts/',''))
                        });
                        copyFiles.push({
                            "expand":true,
                            "cwd":objPlatform.bower_directory+'/'+objPlatform.ui+'/src/fonts/',
                            "src": [(aryFontsFiles[i].replace(objPlatform.bower_directory+'/'+objPlatform.ui+'/src/fonts/',''))],
                            "dest": 'dist/assets/css/fonts/'
                        });
                    }else{
                        fontFiles.push({
                            "overwrite": false,
                            "src": [aryFontsFiles[i]],
                            "dest": 'dev/assets/fonts/'+(aryFontsFiles[i].replace(objPlatform.bower_directory+'/'+objPlatform.ui+'/release/fonts/',''))
                        });
                        copyFiles.push({
                            "expand":true,
                            "cwd":objPlatform.bower_directory+'/'+objPlatform.ui+'/release/fonts/',
                            "src": [(aryFontsFiles[i].replace(objPlatform.bower_directory+'/'+objPlatform.ui+'/release/fonts/',''))],
                            "dest": 'dist/assets/fonts/'
                        });
                    }
                }
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

                    //Get JS Includes
                    jsFiles = jsFiles.concat(processJS(moduleFolder,moduleName));
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

                    //Get Templates
                    ng_templates = ng_templates.concat(processTemplates(viewsFolder));

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

            //Get Templates
            ng_templates = ng_templates.concat(processTemplates('src/views'));
        }

        if(!grunt.file.exists('src/index.html')){
            grunt.log.error('"index.html" missing from your "src" directory.');
            return false;
        }

        grunt.extendConfig({
            htmlbuild:{
                dev: {
                    src: 'src/index.html',
                    dest: 'dev',
                    options: {
                        beautify: true,
                        relative: true,
                        scripts: {
                            bundle: objPlatform.includes.js.concat(js).concat(['dev/assets/js/**/*.js']).concat(['src/js/**/*.js'])
                        },
                        styles: {
                            bundle: ['dev/assets/css/ui.css']
                        }
                    }
                },
                dist: {
                    src: 'src/index.html',
                    dest: 'dist',
                    options: {
                        beautify: true,
                        relative: true,
                        scripts: {
                            bundle: ['dist/assets/js/all.min.js','dist/assets/js/templates.js']
                        },
                        styles: {
                            bundle: ['dist/assets/css/all.min.css']
                        }
                    }
                }
            },
            cssmin:{
                dist:{
                    files:{
                        'dist/assets/css/all.min.css':['_temp-grunt/ui.css']
                    }
                }
            },
            concat:{
                dist:{
                    files:{
                        '_temp-grunt/all.js':objPlatform.includes.js.concat(js).concat(['_temp-grunt/ng.js'])
                    }
                }
            },
            ngAnnotate:{
                dist:{
                    files:{
                        "_temp-grunt/ng.js": ['dev/assets/js/**/*.js','src/js/**/*.js','_temp-grunt/templates.js']
                    }
                }
            },
            uglify:{
                dist:{
                    options: {
                        mangle: false
                    },
                    files:{
                        'dist/assets/js/all.min.js': ['_temp-grunt/all.js']
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
                },
                images:{
                    files: imageFiles
                }
            },
            copy:{
                dist:{
                    files: copyFiles
                }
            },
            ngtemplates:{
                dist: {
                    src: ng_templates,
                    dest: '_temp-grunt/templates.js',
                    options: {
                        module:'app',
                        prefix: '',
                        htmlmin: {
                            collapseBooleanAttributes: true,
                            collapseWhitespace: true,
                            removeComments: true // Only if you don't use comment directives!
                        },
                        url: function(url) {
                            //console.warn();
                            var aryUrl = url.split('/modals/');
                            if(aryUrl.length>1){
                                return 'views/modals/'+aryUrl[1];
                            }
                            aryUrl = url.split('/screens/');
                            if(aryUrl.length>1){
                                return 'views/screens/'+aryUrl[1];
                            }
                            aryUrl = url.split('/includes/');
                            if(aryUrl.length>1){
                                return 'views/includes/'+aryUrl[1];
                            }
                            return url;
                        }
                    }
                }
            }
        });

        grunt.task.run('symlink:js');
        grunt.task.run('symlink:views');
        grunt.task.run('symlink:fonts');
        grunt.task.run('symlink:images');
        grunt.task.run('copy:dist');
        grunt.task.run('ngtemplates:dist');
        grunt.task.run('ngAnnotate:dist');
        grunt.task.run('concat:dist');
        grunt.task.run('uglify:dist');
        grunt.task.run('cssmin:dist');
        grunt.task.run('htmlbuild:dev');
        grunt.task.run('htmlbuild:dist');
        grunt.task.run('clean:after');

    });


    function processTemplates(dir){
        var templateFiles = [];

        function strEndsWith(str, suffix) {
            return str.match(suffix+"$")==suffix;
        }
        if(grunt.file.exists(dir)) {
            var i = 0
            grunt.file.recurse(dir, function callback(abspath, rootdir, subdir, filename) {
                if(strEndsWith(abspath,'.html') || strEndsWith(abspath,'.htm')){
                    templateFiles.push(abspath);
                    //var tt = {
                    //    ngtemplates: {}
                    //};
                    //tt.ngtemplates["dist"+i] = {
                    //    src: [abspath],
                    //    dest: '_temp-grunt/templates.js',
                    //    options: {
                    //        module: 'app',
                    //        prefix: '',
                    //        htmlmin: {
                    //            collapseBooleanAttributes: true,
                    //            collapseWhitespace: true,
                    //            removeComments: true // Only if you don't use comment directives!
                    //        },
                    //        url: function (url) {
                    //            //console.warn();
                    //            var aryUrl = url.split('/modals/');
                    //            if (aryUrl.length > 1) {
                    //                return 'views/modals/' + aryUrl[1];
                    //            }
                    //            aryUrl = url.split('/screens/');
                    //            if (aryUrl.length > 1) {
                    //                return 'views/screens/' + aryUrl[1];
                    //            }
                    //            aryUrl = url.split('/includes/');
                    //            if (aryUrl.length > 1) {
                    //                return 'views/includes/' + aryUrl[1];
                    //            }
                    //            return url;
                    //        }
                    //    }
                    //};
                    //
                    //grunt.extendConfig(tt);
                    //grunt.task.run('ngtemplates:dist'+i);
                    //i++;
                }
            });
        }
        return templateFiles;
    }

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

    function processJS(dir,module){
        var jsFiles = [];
        var jsFolder = dir;
        if(grunt.file.exists(jsFolder)) {
            var aryFoundFolders = [];
            grunt.file.recurse(jsFolder, function callback(abspath, rootdir, subdir, filename) {
                if (subdir !== undefined) {
                    var arySubFolderName = subdir.split('/');
                    if (aryFoundFolders.indexOf(arySubFolderName[0]) === -1) {
                        aryFoundFolders.push(arySubFolderName[0]);
                        jsFiles.push({
                            expand: true,
                            overwrite: false,
                            cwd: jsFolder,
                            src: ['*'],
                            dest: 'dev/assets/js/modules/'+module+'/',
                            filter: 'isDirectory'
                        });
                    }
                } else {
                    jsFiles.push({
                        expand: true,
                        overwrite: false,
                        cwd: jsFolder,
                        src: [filename],
                        dest: 'dev/assets/js/modules/'+module+'/'
                    });
                }
            });
        }
        return jsFiles;
    }

};
