# unity-solution
auto generating a travis compatible unity3d c# solution.

## Installation
    npm install -g unity-solution

## Usage
    unitysolution ./UnityScriptsFolderName [TargetPlatform]
    
The second parameter is optional and can be one of the following:
* Standalone
* iOS
* Android
* WebGL

## Example
    unitysolution ./UnityGameBase iOS
    xbuild /p:Configuration=Debug unity.sln
    
Live example for a travis configuration can be found at the [ugb-source travis config](https://github.com/kwnetzwelt/ugb-source/blob/development/.travis.yml)
