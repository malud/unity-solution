var download    = require('download'),
    spinner     = require('cli-spinner').Spinner,
    path        = require('path'),
    walker      = require('walker'),
    fse         = require('fs-extra'),
    replace     = require('replace'),
    solution    = {};

if(process.argv.length < 3 || process.argv[2].length === 0)
{
    console.error("Please provide a valid path to your source files.");
    process.exit(1);
}

var isPathValid = function (dirPath) {
    return fse.existsSync(dirPath);
};

var isValidFile = function (filePath) {
    return (filePath.indexOf('.cs') === filePath.length - 3);
};

var isEditorScript = function (pathReference, scriptFile) {
    
    for(var i = 0; i < pathReference.length; i++)
    {
        if(scriptFile.indexOf(pathReference[i]) > -1)
        {
            return true;
        }
    }
    return false;
};

var invertSlashes = function (string) {
    return string.replace(/\//ig, '\\');
};

var preprocessPath = function (element, index, array) {
    array[index] = '<Compile Include="' + invertSlashes(element) + '" />';
};

var placeSolution = function (sourceCodePath) {
    var targetPath = path.resolve(sourceCodePath + '/..');
    fse.copySync(path.join(__dirname, 'template'), targetPath);
    return targetPath;
};

var writeScripts = function (solutionPath, scripts) {
    replace({
        regex: '{{SCRIPTITEMS}}',
        replacement: scripts.join('\n'),
        paths: [solutionPath],
        recursive: false,
        silent: true,
        preview: false
    });
};

var writeSymbols = function (solutionPath, platform) {
    var symbols = require(path.join(__dirname, 'data/platformSymbols.json'));
    var replacement = '';
    if(solutionPath.indexOf('Editor') > -1)
    {
        replacement = symbols[platform].Editor;
    } else
    {
        replacement = symbols[platform].Player;
    }
    replace({
        regex: '{{DEFINEDSYMBOLS}}',
        replacement: replacement,
        paths: [solutionPath],
        recursive: false,
        silent: true
    });
    replace({
        regex: '{{PLATFORM}}',
        replacement: platform,
        paths: [solutionPath],
        recursive: false,
        silent: true
    });
};

var setReferencePath = function (solutionPath) {
    console.log('  -> Linking unity references...');
    replace({
        regex: '{{REFERENCEPATH}}',
        replacement: invertSlashes(path.resolve(path.join(solutionPath, 'References'))),
        paths: [solutionPath],
        recursive: true,
        silent: true
    });
};

var prepareReferences = function(solutionPath) {
    var refPath = path.resolve(path.join(solutionPath, 'References'));
    if(fse.existsSync(refPath))
    {
        setReferencePath(solutionPath);
    } else {
        var dl = new download({extract: true, strip: 1});
        dl.get('https://github.com/malud/unity-libs/archive/master.zip').dest(solutionPath);
        //dl.get('https://github.com/malud/unity-libs/archive/5.0.0f4.zip').dest(solutionPath);
        var spi = new spinner('  -> Downloading references...');
        spi.setSpinnerString(10);
        spi.start();

        dl.run(function (err, files) {
            if (err) {
                if (files) {
                    console.error(files);
                }
                throw err;
            }
            spi.stop(true);
            console.log('Solution is prepared now.');
            setReferencePath(solutionPath);
        });
    }
};

solution.create = function (pathParam) {
    if(!isPathValid(pathParam))
    {
        console.error('Path does not exist.');
        return false;
    }

    var unityEditorRelated = [];
    var playerFiles = [];
    var editorFiles = [];

    walker(fullPath)
        .on('dir', function (dir, stat) {
            if(dir.indexOf('Editor') > -1)
            {
                var isChildEditorPath = false;
                for(var i = 0; i < unityEditorRelated.length; i++)
                {
                    if(dir.indexOf(unityEditorRelated[i]) === 0)
                    {
                        isChildEditorPath = true;
                        break;
                    }
                }
                if(!isChildEditorPath) unityEditorRelated.push(dir);
            }
        })
        .on('file', function (file, stat) {
            if(isValidFile(file))
            {
                if(isEditorScript(unityEditorRelated, file))
                {
                    editorFiles.push(file);
                } else
                {
                    playerFiles.push(file);
                }
            }
        })
        .on('end', function() {
            playerFiles.forEach(preprocessPath);
            editorFiles.forEach(preprocessPath);
            slnPath = placeSolution(pathParam);
            writeScripts(path.join(slnPath, 'Assembly-CSharp.csproj'), playerFiles);
            writeScripts(path.join(slnPath, 'Assembly-CSharp-Editor.csproj'), editorFiles);
            var platform = process.argv[3];
            if(platform)
            {
                writeSymbols(path.join(slnPath, 'Assembly-CSharp.csproj'), platform);
                writeSymbols(path.join(slnPath, 'Assembly-CSharp-Editor.csproj'), platform);
            }
            prepareReferences(slnPath);
        })
    ;
};

var fullPath = path.resolve(process.argv[2]);
solution.create(fullPath);

module.exports = solution;