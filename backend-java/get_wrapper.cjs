const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const url = 'https://start.spring.io/starter.zip?type=maven-project&javaVersion=21';
const zipPath = path.join(__dirname, 'starter.zip');

console.log('Downloading Spring Initializr zip to extract Maven Wrapper...');

const file = fs.createWriteStream(zipPath);
https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Download complete, extracting wrapper files...');
        
        // Use PowerShell to extract specific items
        try {
            // Extract the whole zip to a temp folder
            execSync(`powershell -Command "Expand-Archive -Path starter.zip -DestinationPath temp -Force"`);
            
            // Move the wrapper files
            fs.renameSync(path.join(__dirname, 'temp', 'mvnw'), path.join(__dirname, 'mvnw'));
            fs.renameSync(path.join(__dirname, 'temp', 'mvnw.cmd'), path.join(__dirname, 'mvnw.cmd'));
            fs.renameSync(path.join(__dirname, 'temp', '.mvn'), path.join(__dirname, '.mvn'));
            
            console.log('Maven Wrapper extracted successfully.');
        } catch (e) {
            console.error('Failed to extract:', e.message);
        } finally {
            // Cleanup
            try { fs.unlinkSync(zipPath); } catch(e){}
            try { execSync(`powershell -Command "Remove-Item temp -Recurse -Force"`); } catch(e){}
        }
    });
}).on('error', (err) => {
    console.error('Download error:', err.message);
    fs.unlink(zipPath, () => {});
});
