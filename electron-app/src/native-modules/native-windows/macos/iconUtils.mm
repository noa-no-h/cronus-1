#import "iconUtils.h"
#import <stdio.h>

#define MyLog(format, ...) fprintf(stderr, "%s\n", [[NSString stringWithFormat:format, ##__VA_ARGS__] UTF8String])

// In-memory cache for app icon paths
static NSMutableDictionary *iconPathCache = nil;
static NSTimeInterval lastAppListUpdate = 0;
static const NSTimeInterval APP_LIST_CACHE_DURATION = 30.0; // Cache for 30 seconds

NSString* getAppIconPath(NSString* appName) {
    // Initialize cache if needed
    if (!iconPathCache) {
        iconPathCache = [[NSMutableDictionary alloc] init];
    }
    
    // Check cache first
    NSString *cachedPath = [iconPathCache objectForKey:appName];
    if (cachedPath) {
        // Verify the cached file still exists
        NSFileManager *fileManager = [NSFileManager defaultManager];
        if ([fileManager fileExistsAtPath:cachedPath]) {
            return cachedPath;
        } else {
            // Remove stale cache entry
            [iconPathCache removeObjectForKey:appName];
        }
    }
    
    NSWorkspace *workspace = [NSWorkspace sharedWorkspace];
    
    // Create icons directory if it doesn't exist
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES);
    NSString *cachesDirectory = [paths firstObject];
    NSString *iconsDirectory = [cachesDirectory stringByAppendingPathComponent:@"app-icons"];
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    if (![fileManager fileExistsAtPath:iconsDirectory]) {
        NSError *error = nil;  // 🔧 Initialize to nil
        BOOL success = [fileManager createDirectoryAtPath:iconsDirectory 
                                  withIntermediateDirectories:YES 
                                                   attributes:nil 
                                                        error:&error];
        if (!success || error) {  // 🔧 Check both success and error
            // MyLog(@"🚨 Failed to create icons directory: %@", error ? [error localizedDescription] : @"Unknown error");
            return nil;
        }
    }
    
    // Create safe filename from app name
    NSString *safeAppName = [appName stringByReplacingOccurrencesOfString:@" " withString:@"-"];
    safeAppName = [safeAppName stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    safeAppName = [safeAppName stringByReplacingOccurrencesOfString:@":" withString:@"-"];  // 🔧 Also handle colons
    NSString *iconPath = [iconsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.png", safeAppName]];
    
    // Check if icon already exists
    if ([fileManager fileExistsAtPath:iconPath]) {
        // MyLog(@"✅ Using cached icon for %@: %@", appName, iconPath);
        // Cache the path for future use
        [iconPathCache setObject:iconPath forKey:appName];
        return iconPath;
    }
    
    // Check if we need to refresh the app list (expensive operation)
    NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
    static NSArray *cachedRunningApps = nil;
    
    if (!cachedRunningApps || (currentTime - lastAppListUpdate) > APP_LIST_CACHE_DURATION) {
        cachedRunningApps = [workspace runningApplications];
        lastAppListUpdate = currentTime;
        // MyLog(@"🔄 Refreshed running apps cache (%lu apps)", (unsigned long)[cachedRunningApps count]);
    }

    // Try to find the app and get its icon
    for (NSRunningApplication *app in cachedRunningApps) {
        if ([app.localizedName isEqualToString:appName] || 
            [app.bundleIdentifier containsString:appName.lowercaseString]) {
            
            // Get the app icon directly from NSWorkspace
            NSImage *appIcon = [workspace iconForFile:app.bundleURL.path];
            if (appIcon) {
                // Resize to 32x32
                NSSize newSize = NSMakeSize(32, 32);
                NSImage *resizedIcon = [[NSImage alloc] initWithSize:newSize];
                [resizedIcon lockFocus];
                [appIcon drawInRect:NSMakeRect(0, 0, newSize.width, newSize.height)
                           fromRect:NSZeroRect
                          operation:NSCompositingOperationCopy
                           fraction:1.0];
                [resizedIcon unlockFocus];
                
                // Convert to PNG data
                CGImageRef cgImage = [resizedIcon CGImageForProposedRect:nil context:nil hints:nil];
                if (cgImage) {  // 🔧 Check if cgImage is valid
                    NSBitmapImageRep *bitmapRep = [[NSBitmapImageRep alloc] initWithCGImage:cgImage];
                    NSData *pngData = [bitmapRep representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
                    
                    if (pngData) {
                        // Save to file
                        NSError *writeError = nil;  // 🔧 Use different variable name
                        BOOL writeSuccess = [pngData writeToFile:iconPath options:NSDataWritingAtomic error:&writeError];
                        if (!writeSuccess || writeError) {  // 🔧 Check both success and error
                            // MyLog(@"🚨 Failed to save icon for %@: %@", appName, writeError ? [writeError localizedDescription] : @"Unknown write error");
                            return nil;
                        }
                        
                        // MyLog(@"🎨 Generated icon file for %@ (%lu bytes): %@", appName, (unsigned long)pngData.length, iconPath);
                        // Cache the successful path
                        [iconPathCache setObject:iconPath forKey:appName];
                        return iconPath;
                    } else {
                        // MyLog(@"🚨 Failed to convert icon to PNG data for %@", appName);
                    }
                } else {
                    // MyLog(@"🚨 Failed to create CGImage for %@", appName);
                }
                
                // Clean up
            } else {
                // MyLog(@"🚨 No icon found for app %@", appName);
            }
        }
    }
    
    // MyLog(@"🎨 No icon found for %@", appName);
    return nil;
} 