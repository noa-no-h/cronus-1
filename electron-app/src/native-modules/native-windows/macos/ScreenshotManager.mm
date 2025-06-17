#import "ScreenshotManager.h"
#import <os/log.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>


// Custom Log Macro
#define MyLog(format, ...) { \
    static os_log_t log_handle = NULL; \
    if (log_handle == NULL) { \
        log_handle = os_log_create("com.cronus.app", "ScreenshotManager"); \
    } \
    NSString *log_message = [NSString stringWithFormat:format, ##__VA_ARGS__]; \
    os_log(log_handle, "%{public}s", [log_message UTF8String]); \
}

@implementation ScreenshotManager {
    NSTimer *screenshotTimer;
}

- (void)startPeriodicScreenshotCapture {
    [self stopPeriodicScreenshotCapture];
    
    // Take screenshot every 30 seconds
    screenshotTimer = [NSTimer scheduledTimerWithTimeInterval:30.0
                                                     target:self
                                                   selector:@selector(takeScreenshot)
                                                   userInfo:nil
                                                    repeats:YES];
    [[NSRunLoop currentRunLoop] addTimer:screenshotTimer forMode:NSRunLoopCommonModes];
    MyLog(@"Screenshot timer started");
}

- (void)stopPeriodicScreenshotCapture {
    [screenshotTimer invalidate];
    screenshotTimer = nil;
    MyLog(@"Screenshot timer stopped");
}

- (void)takeScreenshot {
    if (!self.delegate) return;
    
    NSDictionary *windowInfo = [self.delegate getActiveWindowForScreenshotManager:self];
    if (!windowInfo) return;
    
    CGWindowID windowId = [[windowInfo objectForKey:@"id"] unsignedIntValue];
    NSData *screenshotData = [self captureWindowScreenshot:windowId];
    
    if (!screenshotData) {
        MyLog(@"Failed to capture screenshot");
        return;
    }
    
    // Save screenshot to a temporary file
    NSString *tempDir = NSTemporaryDirectory();
    NSString *fileName = [NSString stringWithFormat:@"%@.jpg", [[NSUUID UUID] UUIDString]];
    NSString *filePath = [tempDir stringByAppendingPathComponent:fileName];
    BOOL success = [screenshotData writeToFile:filePath atomically:YES];

    if (!success) {
        MyLog(@"Failed to save screenshot to temp file: %@", filePath);
        return;
    }
    
    [self.delegate screenshotManager:self didCaptureScreenshot:filePath forWindowInfo:windowInfo];
}

- (NSData*)captureWindowScreenshot:(CGWindowID)windowId {
    CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionIncludingWindow, windowId);
    CGRect windowBounds = CGRectNull;
    if (windowList && CFArrayGetCount(windowList) > 0) {
        CFDictionaryRef windowInfoDict = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, 0);
        CFDictionaryRef boundsDict = (CFDictionaryRef)CFDictionaryGetValue(windowInfoDict, kCGWindowBounds);
        CGRectMakeWithDictionaryRepresentation(boundsDict, &windowBounds);
    }
    if(windowList) CFRelease(windowList);

    if (CGRectIsNull(windowBounds)) {
        MyLog(@"Could not get window bounds for screenshot");
        return nil;
    }

    CGImageRef imageRef = CGWindowListCreateImage(
        windowBounds,
        kCGWindowListOptionIncludingWindow,
        windowId,
        kCGWindowImageBoundsIgnoreFraming | kCGWindowImageNominalResolution
    );

    if (!imageRef) {
        MyLog(@"Failed to create window image.");
        return nil;
    }

    // Convert to JPEG with compression
    NSMutableData *imageData = [NSMutableData data];
    CGImageDestinationRef destination = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)imageData, (CFStringRef)UTTypeJPEG.identifier, 1, NULL);

    if (!destination) {
        CGImageRelease(imageRef);
        return nil;
    }
    
    NSDictionary *properties = @{ (__bridge NSString *)kCGImageDestinationLossyCompressionQuality: @0.5 };
    CGImageDestinationAddImage(destination, imageRef, (__bridge CFDictionaryRef)properties);
    CGImageDestinationFinalize(destination);
    
    CFRelease(destination);
    CGImageRelease(imageRef);
    
    return imageData;
}

- (void)dealloc {
    [self stopPeriodicScreenshotCapture];
    [super dealloc];
}

@end 