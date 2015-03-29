var download    = require('download'),
    spinner     = require('cli-spinner'),
    path        = require('path'),
    walker      = require('walker'),
    fse         = require('fs-extra'),
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

var preprocessPath = function (element, index, array) {
    array[index] = '<Compile Include="' + element + '" />';
}

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
        })
    ;
};

var fullPath = path.resolve(process.argv[2]);
solution.create(fullPath);

module.exports = solution;