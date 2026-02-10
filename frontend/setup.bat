@echo off
if not exist app mkdir app
if not exist app\driver mkdir app\driver
if not exist "app\driver\[id]" mkdir "app\driver\[id]"
if not exist public mkdir public
echo Directories created successfully!
