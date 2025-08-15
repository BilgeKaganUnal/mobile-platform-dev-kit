# Mobile App Assets

This directory contains the required assets for the Expo mobile application. You'll need to create these image files according to the specifications below.

## Required Images

### App Icons

#### `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Main app icon, used for iOS and Android app stores
- **Requirements**: Should be a square image with your app's logo/branding

#### `adaptive-icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground
- **Requirements**: Should fit within a 768x768px safe area (center of the 1024x1024 canvas)

### Splash Screen

#### `splash.png`
- **Size**: 1284x2778 pixels (iPhone 14 Pro Max resolution)
- **Format**: PNG
- **Background**: Should match your app's primary color
- **Usage**: Launch screen while app is loading
- **Content**: Simple logo/branding, avoid complex UI elements

### Web/PWA

#### `favicon.png`
- **Size**: 48x48 pixels (minimum), recommended 256x256
- **Format**: PNG
- **Usage**: Browser tab icon and PWA icon
- **Requirements**: Simplified version of your app icon

## Creating Assets

### Using Design Tools

1. **Figma/Sketch/Adobe XD**: Create your designs at the required dimensions
2. **Export Settings**: Use PNG format with appropriate compression
3. **Color Profile**: Use sRGB color space for best compatibility

### Using Online Tools

1. **App Icon Generator**: Use tools like [App Icon Generator](https://www.appicon.co/) to generate all sizes from one 1024x1024 image
2. **Splash Screen**: Tools like [Ape Tools Splash](https://apetools.webprofusion.com/#/tools/imagegorilla) can help create splash screens

### Asset Guidelines

- **Consistency**: Maintain consistent branding across all assets
- **Simplicity**: Keep designs simple and recognizable at small sizes
- **Testing**: Test assets on different devices and screen densities
- **Copyright**: Ensure you have rights to use all visual elements

## Expo Configuration

Once you have your assets, update `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

## Development Placeholders

For development, you can use simple colored squares or basic geometric shapes. The important thing is to have files with the correct names and dimensions.

### Quick Placeholder Creation

You can create basic placeholders using online tools or image editors:

1. Create solid color squares for icons (use your brand color)
2. Add simple text or shapes to distinguish between different assets
3. Use the exact dimensions specified above

## Production Considerations

- **High Resolution**: Always create assets at the highest required resolution
- **Multiple Formats**: Consider creating SVG versions for scalability
- **Platform Specific**: iOS and Android have different icon requirements
- **App Store Guidelines**: Review Apple and Google's icon guidelines before submission

## File Structure

```
assets/
├── README.md           # This file
├── icon.png           # Main app icon (1024x1024)
├── adaptive-icon.png   # Android adaptive icon (1024x1024)
├── splash.png         # Splash screen (1284x2778)
└── favicon.png        # Web favicon (256x256)
```

## Resources

- [Expo Asset Documentation](https://docs.expo.dev/guides/app-icons/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [PWA Icon Best Practices](https://web.dev/add-manifest/#icons)