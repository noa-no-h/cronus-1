#import "iconUtils.h"
#import <stdio.h>

#define MyLog(format, ...) fprintf(stderr, "%s\n", [[NSString stringWithFormat:format, ##__VA_ARGS__] UTF8String])

NSString* getAppIconPath(NSString* appName) {
    // Check for null input
    if (!appName) {
        // MyLog(@"⚠️ App name is nil");
        return nil;
    }
    
    NSString *iconPath = nil;
    
    @try {
        NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
        
        // Create icons directory if it doesn't exist
        NSArray *paths = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES);
        NSString *cachesDirectory = [paths firstObject];
        NSString *iconsDirectory = [cachesDirectory stringByAppendingPathComponent:@"app-icons"];
        
        NSFileManager *fileManager = [NSFileManager defaultManager];
        if (![fileManager fileExistsAtPath:iconsDirectory]) {
            NSError *error = nil;
            BOOL success = [fileManager createDirectoryAtPath:iconsDirectory 
                                  withIntermediateDirectories:YES 
                                                   attributes:nil 
                                                        error:&error];
            if (!success || error) {
                // MyLog(@"🚨 Failed to create icons directory: %@", error ? [error localizedDescription] : @"Unknown error");
                return nil;
            }
        }
        
        // Create safe filename from app name
        NSString *safeAppName = [appName stringByReplacingOccurrencesOfString:@" " withString:@"-"];
        safeAppName = [safeAppName stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
        safeAppName = [safeAppName stringByReplacingOccurrencesOfString:@":" withString:@"-"];
        iconPath = [iconsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.png", safeAppName]];
        
        // Check if icon already exists
        if ([fileManager fileExistsAtPath:iconPath]) {
            // MyLog(@"✅ Using cached icon for %@: %@", appName, iconPath);
            return iconPath;
        }
        
        // Try to find the app and get its icon
        NSArray *runningApps = [workspace runningApplications];
        for (NSRunningApplication *app in runningApps) {
            if ([app.localizedName isEqualToString:appName] || 
                [app.bundleIdentifier containsString:appName.lowercaseString]) {
                
                // Check if app.bundleURL is valid
                if (!app.bundleURL) {
                    // MyLog(@"⚠️ BundleURL is nil for app %@", appName);
                    continue;
                }
                
                // Get the app icon directly from NSWorkspace
                NSString *appPath = app.bundleURL.path;
                if (!appPath || appPath.length == 0) {
                    // MyLog(@"⚠️ App path is invalid for %@", appName);
                    continue;
                }
                
                NSImage *appIcon = [workspace iconForFile:appPath];
                if (!appIcon) {
                    // MyLog(@"⚠️ Could not get icon for %@", appName);
                    continue;
                }
                
                // Resize to 32x32
                NSSize newSize = NSMakeSize(32, 32);
                NSImage *resizedIcon = [[NSImage alloc] initWithSize:newSize];
                if (!resizedIcon) {
                    // MyLog(@"⚠️ Could not create resized icon for %@", appName);
                    continue;
                }
                
                [resizedIcon lockFocus];
                [appIcon drawInRect:NSMakeRect(0, 0, newSize.width, newSize.height)
                           fromRect:NSZeroRect
                          operation:NSCompositingOperationCopy
                           fraction:1.0];
                [resizedIcon unlockFocus];
                    
                // Convert to PNG data
                // Make sure the resizedIcon is valid
                if (!resizedIcon) {
                    // MyLog(@"⚠️ Resized icon is nil for app %@", appName);
                    continue;
                }
                
                CGImageRef cgImage = [resizedIcon CGImageForProposedRect:nil context:nil hints:nil];
                if (!cgImage) {
                    // MyLog(@"⚠️ CGImage is nil for app %@", appName);
                    continue;
                }
                
                NSBitmapImageRep *bitmapRep = [[NSBitmapImageRep alloc] initWithCGImage:cgImage];
                if (!bitmapRep) {
                    // MyLog(@"⚠️ BitmapRep is nil for app %@", appName);
                    continue;
                }
                
                NSData *pngData = [bitmapRep representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
                if (!pngData) {
                    // MyLog(@"⚠️ PNG data is nil for app %@", appName);
                    continue;
                }
                
                // Save to file
                NSError *writeError = nil;
                BOOL writeSuccess = [pngData writeToFile:iconPath options:NSDataWritingAtomic error:&writeError];
                if (!writeSuccess || writeError) {
                    // MyLog(@"🚨 Failed to save icon for %@: %@", appName, writeError ? [writeError localizedDescription] : @"Unknown write error");
                    continue;
                }
                
                // MyLog(@"🎨 Generated icon file for %@ (%lu bytes): %@", appName, (unsigned long)pngData.length, iconPath);
                return iconPath;
            }
        }
    } 
    @catch (NSException *exception) {
        // MyLog(@"⚠️ Exception in getAppIconPath: %@", [exception description]);
        return nil;
    }
    
    // MyLog(@"🎨 No icon found for %@", appName);
    return nil;
} 