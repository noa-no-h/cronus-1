#import "browserTabUtils.h"

// Custom Log Macro
#define MyLog(format, ...) fprintf(stderr, "%s\n", [[NSString stringWithFormat:format, ##__VA_ARGS__] UTF8String])

@implementation BrowserTabUtils

+ (NSDictionary*)getChromeTabInfo {
    MyLog(@"Starting Chrome tab info gathering...");
    
    // First check if Chrome is running
    NSRunningApplication *chromeApp = [[NSRunningApplication runningApplicationsWithBundleIdentifier:@"com.google.Chrome"] firstObject];
    if (!chromeApp) {
        MyLog(@"Chrome is not running");
        return nil;
    }
    
    // Check if Chrome is frontmost
    if (![chromeApp isActive]) {
        MyLog(@"Chrome is not the active application");
        return nil;
    }
    
    // First try to get just the URL and title without JavaScript
    NSString *basicScript = @"tell application \"Google Chrome\"\n"
                           "  try\n"
                           "    set activeTab to active tab of front window\n"
                           "    set tabUrl to URL of activeTab\n"
                           "    set tabTitle to title of activeTab\n"
                           "    return tabUrl & \"|\" & tabTitle\n"
                           "  on error errMsg\n"
                           "    return \"ERROR|\" & errMsg\n"
                           "  end try\n"
                           "end tell";
    
    NSAppleScript *basicAppleScript = [[NSAppleScript alloc] initWithSource:basicScript];
    NSDictionary *error = nil;
    NSAppleEventDescriptor *basicResult = [basicAppleScript executeAndReturnError:&error];
    
    if (error) {
        MyLog(@"Basic AppleScript error: %@", error);
        return nil;
    }
    
    NSString *basicInfo = [basicResult stringValue];
    if (!basicInfo || [basicInfo hasPrefix:@"ERROR|"]) {
        MyLog(@"Basic script error: %@", basicInfo);
        return nil;
    }
    
    NSArray *basicComponents = [basicInfo componentsSeparatedByString:@"|"];
    if (basicComponents.count < 2) {
        MyLog(@"Invalid basic info components");
        return nil;
    }
    
    // Create base info with URL and title
    NSMutableDictionary *tabInfo = [@{
        @"url": basicComponents[0],
        @"title": basicComponents[1],
        @"type": @"browser",
        @"browser": @"chrome",
        @"ownerName": @"Google Chrome",
        @"timestamp": @([[NSDate date] timeIntervalSince1970] * 1000)
    } mutableCopy];
    
    // Try to get content with JavaScript if possible
    NSString *jsScript = @"tell application \"Google Chrome\"\n"
                        "  try\n"
                        "    set activeTab to active tab of front window\n"
                        "    set tabContent to execute activeTab javascript \"document.body.innerText\"\n"
                        "    return tabContent\n"
                        "  on error errMsg\n"
                        "    if errMsg contains \"JavaScript\" then\n"
                        "      return \"JS_DISABLED\"\n"
                        "    end if\n"
                        "    return \"ERROR|\" & errMsg\n"
                        "  end try\n"
                        "end tell";
    
    NSAppleScript *jsAppleScript = [[NSAppleScript alloc] initWithSource:jsScript];
    NSAppleEventDescriptor *jsResult = [jsAppleScript executeAndReturnError:&error];
    
    if (!error && jsResult) {
        NSString *jsInfo = [jsResult stringValue];
        if (jsInfo && ![jsInfo hasPrefix:@"ERROR|"]) {
            if ([jsInfo isEqualToString:@"JS_DISABLED"]) {
                MyLog(@"JavaScript is disabled in Chrome. Please enable it in View > Developer > Allow JavaScript from Apple Events");
            } else {
                tabInfo[@"content"] = jsInfo;
                MyLog(@"🎯 CHROME CONTENT CAPTURED:");
                MyLog(@"   App: %@", tabInfo[@"url"]);
                MyLog(@"   Title: %@", tabInfo[@"title"]);
                MyLog(@"   Content Length: %lu characters", (unsigned long)[jsInfo length]);
                MyLog(@"   Content Preview (first 200 chars): %@", [jsInfo length] > 200 ? [jsInfo substringToIndex:200] : jsInfo);
            }
        }
    }
    
    return tabInfo;
}

+ (NSDictionary*)getSafariTabInfo {
    NSMutableDictionary *tabInfo = [NSMutableDictionary dictionary];
    
    // First try to get just the URL and title
    NSString *basicScript = @"tell application \"Safari\"\n"
                            "  try\n"
                            "    set currentTab to current tab of front window\n"
                            "    set tabUrl to URL of currentTab\n"
                            "    set tabTitle to name of currentTab\n"
                            "    return tabUrl & \"|\" & tabTitle\n"
                            "  on error errMsg\n"
                            "    return \"ERROR|\" & errMsg\n"
                            "  end try\n"
                            "end tell";
    
    NSAppleScript *basicAppleScript = [[NSAppleScript alloc] initWithSource:basicScript];
    NSDictionary *error = nil;
    NSAppleEventDescriptor *basicResult = [basicAppleScript executeAndReturnError:&error];
    
    if (!error && basicResult) {
        NSString *basicInfo = [basicResult stringValue];
        if (basicInfo && ![basicInfo hasPrefix:@"ERROR|"]) {
            NSArray *components = [basicInfo componentsSeparatedByString:@"|"];
            if (components.count >= 2) {
                tabInfo[@"url"] = components[0];
                tabInfo[@"title"] = components[1];
                tabInfo[@"type"] = @"browser";
                tabInfo[@"ownerName"] = @"Safari";
                
                // Now try to get the content
                NSString *contentScript = @"tell application \"Safari\"\n"
                                        "  try\n"
                                        "    set currentTab to current tab of front window\n"
                                        "    set tabContent to do JavaScript \"document.body.innerText\" in currentTab\n"
                                        "    return tabContent\n"
                                        "  on error errMsg\n"
                                        "    if errMsg contains \"JavaScript\" then\n"
                                        "      return \"JS_DISABLED\"\n"
                                        "    end if\n"
                                        "    return \"ERROR|\" & errMsg\n"
                                        "  end try\n"
                                        "end tell";
                
                NSAppleScript *contentAppleScript = [[NSAppleScript alloc] initWithSource:contentScript];
                NSAppleEventDescriptor *contentResult = [contentAppleScript executeAndReturnError:&error];
                
                if (!error && contentResult) {
                    NSString *content = [contentResult stringValue];
                    if (content && ![content hasPrefix:@"ERROR|"]) {
                        if ([content isEqualToString:@"JS_DISABLED"]) {
                            MyLog(@"JavaScript is disabled in Safari. Please enable it in Safari > Settings > Advanced > Allow JavaScript from Apple Events");
                        } else {
                            tabInfo[@"content"] = content;
                            MyLog(@"Successfully got Safari content, length: %lu", (unsigned long)[content length]);
                            MyLog(@"🎯 SAFARI CONTENT CAPTURED:");
                            MyLog(@"   URL: %@", tabInfo[@"url"]);
                            MyLog(@"   Title: %@", tabInfo[@"title"]);
                            MyLog(@"   Content Length: %lu characters", (unsigned long)[content length]);
                            MyLog(@"   Content Preview (first 200 chars): %@", [content length] > 200 ? [content substringToIndex:200] : content);
                        }
                    }
                }
                
                tabInfo[@"browser"] = @"safari";
                return tabInfo;
            }
        }
    }
    
    if (error) {
        MyLog(@"Safari AppleScript error: %@", error);
    }
    
    return nil;
}

@end 