#import "chromeTabTracking.h"
#import "browserTabUtils.h"
#import "permissionManager.h"

// Custom Log Macro
#define MyLog(format, ...) fprintf(stderr, "%s\n", [[NSString stringWithFormat:format, ##__VA_ARGS__] UTF8String])

@implementation ChromeTabTracking

- (id)init {
    self = [super init];
    if (self) {
        _lastKnownChromeURL = nil;
        _lastKnownChromeTitle = nil;
        _isChromeActive = NO;
        _chromeTabCheckTimer = nil;
    }
    return self;
}

- (void)dealloc {
    [self stopChromeTabTimer];
    [_lastKnownChromeURL release];
    [_lastKnownChromeTitle release];
    [super dealloc];
}

- (NSDictionary*)getCurrentChromeTabBriefInfo {
    // Check if permission requests are enabled before proceeding
    if (![PermissionManager shouldRequestPermissions]) {
        MyLog(@"[Chrome Tab Brief] ⚠️  Permission requests disabled - skipping Chrome tab tracking during onboarding");
        return nil;
    }
    
    NSString *scriptSource = @"tell application \"Google Chrome\"\n\
  try\n\
    if not (exists front window) then return \"ERROR|No window\"\n\
    set activeTab to active tab of front window\n\
    set tabUrl to URL of activeTab\n\
    set tabTitle to title of activeTab\n\
    return tabUrl & \"|\" & tabTitle\n\
  on error errMsg\n\
    return \"ERROR|\" & errMsg\n\
  end try\n\
end tell";
    NSAppleScript *appleScript = [[NSAppleScript alloc] initWithSource:scriptSource];
    NSDictionary *errorInfo = nil;
    NSAppleEventDescriptor *descriptor = [appleScript executeAndReturnError:&errorInfo];
    [appleScript release];

    if (errorInfo) {
        MyLog(@"[Chrome Tab Brief] AppleScript execution error: %@", errorInfo);
        
        // If this is the first time accessing Chrome and permissions aren't granted,
        // request Apple Events permission through our centralized system
        if ([PermissionManager shouldRequestPermissions]) {
            MyLog(@"[Chrome Tab Brief] 🔑 Requesting Apple Events permission for Chrome tab tracking");
            [PermissionManager requestPermission:PermissionTypeAppleEvents completion:^(PermissionStatus status) {
                MyLog(@"[Chrome Tab Brief] 📋 Apple Events permission request completed with status: %ld", (long)status);
            }];
        }
        
        return nil;
    }

    NSString *resultString = [descriptor stringValue];
    if (!resultString || [resultString hasPrefix:@"ERROR|"]) {
        if (resultString && ![resultString isEqualToString:@"ERROR|No window"]) { // Don't log for "No window" as it's common
             MyLog(@"[Chrome Tab Brief] AppleScript reported error: %@", resultString);
        }
        return nil;
    }
    
    NSArray *components = [resultString componentsSeparatedByString:@"|"];
    if (components.count >= 1) { // URL is component 0, title might be empty if not present.
        NSString *url = components[0];
        NSString *title = (components.count > 1) ? components[1] : @""; // Handle missing title gracefully
        return @{@"url": url, @"title": title};
    }
    
    MyLog(@"[Chrome Tab Brief] Invalid components from AppleScript: %@", resultString);
    return nil;
}

- (void)startChromeTabTimer {
    if (_chromeTabCheckTimer) { // Already running or improperly cleaned up
        [_chromeTabCheckTimer invalidate];
        [_chromeTabCheckTimer release];
        _chromeTabCheckTimer = nil;
    }
    // Check every 1.5 seconds
    _chromeTabCheckTimer = [[NSTimer scheduledTimerWithTimeInterval:1.5
                                                                target:self
                                                              selector:@selector(performChromeTabCheck)
                                                              userInfo:nil
                                                               repeats:YES] retain];
    [[NSRunLoop currentRunLoop] addTimer:_chromeTabCheckTimer forMode:NSRunLoopCommonModes];
    MyLog(@"[Chrome Tab] ▶️ Chrome tab check timer started.");
}

- (void)stopChromeTabTimer {
    if (_chromeTabCheckTimer) {
        [_chromeTabCheckTimer invalidate];
        [_chromeTabCheckTimer release];
        _chromeTabCheckTimer = nil;
        MyLog(@"[Chrome Tab] ⏹️ Chrome tab check timer stopped.");
    }
}

- (void)performChromeTabCheck {
    if (!_isChromeActive) {
        return;
    }

    NSDictionary *briefTabInfo = [self getCurrentChromeTabBriefInfo];
    if (briefTabInfo) {
        NSString *currentURL = briefTabInfo[@"url"];     // Can be nil
        NSString *currentTitle = briefTabInfo[@"title"]; // Can be nil

        // Check for changes, handles nil comparisons correctly
        BOOL urlChanged = (_lastKnownChromeURL || currentURL) && ![_lastKnownChromeURL isEqualToString:currentURL];
        BOOL titleChanged = (_lastKnownChromeTitle || currentTitle) && ![_lastKnownChromeTitle isEqualToString:currentTitle];

        if (urlChanged || titleChanged) {
            MyLog(@"[Chrome Tab] 🔄 Chrome Tab Switch Detected:");
            if (urlChanged) MyLog(@"   URL: '%@' -> '%@'", _lastKnownChromeURL, currentURL);
            if (titleChanged) MyLog(@"   Title: '%@' -> '%@'", _lastKnownChromeTitle, currentTitle);

            // Update known state
            NSString *newURL = [currentURL copy];
            [_lastKnownChromeURL release];
            _lastKnownChromeURL = newURL;

            NSString *newTitle = [currentTitle copy];
            [_lastKnownChromeTitle release];
            _lastKnownChromeTitle = newTitle;
            
            // Get full window details for the new tab state
            NSDictionary *activeWindowDetails = [BrowserTabUtils getChromeTabInfo];
            if (activeWindowDetails) {
                 if (self.delegate && [self.delegate respondsToSelector:@selector(chromeTabDidSwitch:)]) {
                    [self.delegate chromeTabDidSwitch:activeWindowDetails];
                }
            } else {
                MyLog(@"   Could not get active window details after tab switch.");
            }
        }
    }
}

@end 