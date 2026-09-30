chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action !== "execute_browser_action") {
        return;
    }

    const action = message.data;

    console.log("PRIVI-BROWSER executing:", action);

    // SEARCH YOUTUBE
    if (action.action === "search_youtube") {

        const query = encodeURIComponent(action.target);

        chrome.tabs.create({
            url: `https://www.youtube.com/results?search_query=${query}`
        });

        sendResponse({
            success: true,
            message: "YouTube search opened"
        });

        return true;
    }

    // SEARCH GOOGLE
    if (action.action === "search_google") {

        const query = encodeURIComponent(action.target);

        chrome.tabs.create({
            url: `https://www.google.com/search?q=${query}`
        });

        sendResponse({
            success: true,
            message: "Google search opened"
        });

        return true;
    }

    // PLAY
    if (action.action === "play") {

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {

                if (!tabs.length) {
                    sendResponse({
                        success: false,
                        message: "No active tab"
                    });
                    return;
                }

                chrome.scripting.executeScript({
                    target: {
                        tabId: tabs[0].id
                    },
                    func: () => {

                        const video =
                            document.querySelector("video");

                        if (video) {
                            video.play();
                            return "Video played";
                        }

                        return "No video found";
                    }
                }).then((result) => {

                    sendResponse({
                        success: true,
                        message: result[0].result
                    });

                }).catch((error) => {

                    sendResponse({
                        success: false,
                        message: error.message
                    });

                });
            }
        );

        return true;
    }

    // PAUSE
    if (action.action === "pause") {

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {

                if (!tabs.length) {
                    sendResponse({
                        success: false,
                        message: "No active tab"
                    });
                    return;
                }

                chrome.scripting.executeScript({
                    target: {
                        tabId: tabs[0].id
                    },
                    func: () => {

                        const video =
                            document.querySelector("video");

                        if (video) {
                            video.pause();
                            return "Video paused";
                        }

                        return "No video found";
                    }
                }).then((result) => {

                    sendResponse({
                        success: true,
                        message: result[0].result
                    });

                }).catch((error) => {

                    sendResponse({
                        success: false,
                        message: error.message
                    });

                });
            }
        );

        return true;
    }

    // SCROLL
    if (action.action === "scroll") {

        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs) => {

                if (!tabs.length) {
                    sendResponse({
                        success: false,
                        message: "No active tab"
                    });
                    return;
                }

                chrome.scripting.executeScript({
                    target: {
                        tabId: tabs[0].id
                    },
                    func: () => {
                        window.scrollBy({
                            top: 600,
                            behavior: "smooth"
                        });
                    }
                });

                sendResponse({
                    success: true,
                    message: "Page scrolled"
                });
            }
        );

        return true;
    }

    // WAIT
    if (action.action === "wait") {

        const seconds =
            Number(action.target) || 2;

        setTimeout(() => {

            sendResponse({
                success: true,
                message: `Waited ${seconds} seconds`
            });

        }, seconds * 1000);

        return true;
    }

    // UNKNOWN ACTION
    sendResponse({
        success: false,
        message:
            `Action '${action.action}' is not supported yet`
    });

    return true;
});