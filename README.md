# ImagePassportCropper

A Windows desktop application for automatically detecting faces and cropping images to passport photo specifications.

## Features

- **Automatic Face Detection**: Uses OpenCV to find faces in images.
- **Multiple Face Selection**: If more than one face is detected, you can choose which one to use.
- **Crop Presets**: Standard presets for Passport (35x45mm) and ID (2x2in) photos.
- **Manual Adjustments**: Nudge and scale the crop area for the perfect result.
- **Batch Processing**: Process a whole folder of images at once.
- **High-Quality Export**: Save images as high-quality JPEG or PNG with 300 DPI for printing.
- **Drag and Drop**: Easily add images by dragging them onto the application window.

## Prerequisites

- [.NET 7 SDK](https://dotnet.microsoft.com/download/dotnet/7.0)

## How to Build

1.  **Clone the repository or extract the source files.**
2.  **Restore NuGet packages:**
    Open a terminal or command prompt in the root directory (where `ImagePassportCropper.sln` is located) and run:
    ```sh
    dotnet restore
    ```
3.  **Build the project:**
    ```sh
    dotnet build -c Release
    ```
    The output will be in `ImagePassportCropper/bin/Release/net7.0-windows/`.

## How to Publish as a Single Executable

To create a single, self-contained `.exe` file that can be run on any modern Windows machine (without needing to install .NET), run the following command from the root directory:

```sh
dotnet publish ImagePassportCropper/ImagePassportCropper.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:PublishTrimmed=true
```

The final executable will be located at: `ImagePassportCropper/bin/Release/net7.0-windows/win-x64/publish/ImagePassportCropper.exe`

## How to Create an Installer (Optional)

An [Inno Setup](https://jrsoftware.org/isinfo.php) script (`setup.iss`) is provided.

1.  Install Inno Setup.
2.  Publish the application as described above.
3.  Open `setup.iss` in the Inno Setup Compiler.
4.  Update the `Source` path in the `[Files]` section to point to your published `.exe` file.
5.  Compile the script to generate a `setup.exe` installer.

## Dependencies

- [OpenCvSharp4.Windows](https://www.nuget.org/packages/OpenCvSharp4.Windows/) - A .NET wrapper for the OpenCV library.
- [System.Drawing.Common](https://www.nuget.org/packages/System.Drawing.Common/) - Provides access to GDI+ graphics functionality.

The required Haar Cascade classifier file (`haarcascade_frontalface_default.xml`) is included in the project and will be automatically copied to the output directory.
