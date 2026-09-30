// ============================================================
// PRIVI-BROWSER
// AI Browser Agent + Privacy Protection
// ============================================================

const status = document.getElementById("status");

function setStatus(message) {
    if (status) {
        status.textContent = message;
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================================
// GET ACTIVE TAB
// ============================================================

async function getActiveTab() {

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tabs.length) {
        throw new Error("No active tab found.");
    }

    return tabs[0];
}


// ============================================================
// RUN JAVASCRIPT ON PAGE
// ============================================================

async function runOnPage(tabId, func, args = []) {

    const result = await chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        func: func,
        args: args
    });

    return result?.[0]?.result;
}


// ============================================================
// 🔐 GET SENSITIVE FIELDS
// ============================================================

async function getSensitiveFields(tabId) {

    const results =
        await chrome.scripting.executeScript({

            target: {
                tabId: tabId,
                allFrames: true
            },

            func: () => {

                const elements =
                    Array.from(
                        document.querySelectorAll(
                            "input, textarea, [contenteditable='true'], [role='textbox']"
                        )
                    );


                function getNearbyText(el) {

                    const parts = [];

                    if (el.getAttribute("aria-label")) {
                        parts.push(
                            el.getAttribute("aria-label")
                        );
                    }

                    if (el.getAttribute("placeholder")) {
                        parts.push(
                            el.getAttribute("placeholder")
                        );
                    }

                    if (el.getAttribute("name")) {
                        parts.push(
                            el.getAttribute("name")
                        );
                    }

                    if (el.getAttribute("id")) {
                        parts.push(
                            el.getAttribute("id")
                        );
                    }

                    if (el.getAttribute("autocomplete")) {
                        parts.push(
                            el.getAttribute("autocomplete")
                        );
                    }

                    if (el.id) {

                        const label =
                            document.querySelector(
                                `label[for="${CSS.escape(el.id)}"]`
                            );

                        if (label) {
                            parts.push(
                                label.innerText || ""
                            );
                        }
                    }

                    if (el.parentElement) {
                        parts.push(
                            el.parentElement.innerText || ""
                        );
                    }

                    if (el.previousElementSibling) {
                        parts.push(
                            el.previousElementSibling.innerText || ""
                        );
                    }

                    return parts
                        .join(" ")
                        .toLowerCase();
                }


                function isVisible(el) {

                    const rect =
                        el.getBoundingClientRect();

                    const style =
                        window.getComputedStyle(el);

                    return (
                        rect.width > 0 &&
                        rect.height > 0 &&
                        style.display !== "none" &&
                        style.visibility !== "hidden" &&
                        style.opacity !== "0"
                    );
                }


                let frameX = 0;
                let frameY = 0;

                try {

                    if (window.frameElement) {

                        const frameRect =
                            window.frameElement
                                .getBoundingClientRect();

                        frameX =
                            frameRect.left;

                        frameY =
                            frameRect.top;
                    }

                }
                catch (error) {
                    console.log(
                        "Frame position unavailable."
                    );
                }


                return elements

                    .map(el => {

                        if (!isVisible(el)) {
                            return null;
                        }


                        const type =
                            (
                                el.getAttribute("type") ||
                                el.type ||
                                ""
                            ).toLowerCase();


                        const name =
                            (
                                el.getAttribute("name") ||
                                ""
                            ).toLowerCase();


                        const id =
                            (
                                el.getAttribute("id") ||
                                ""
                            ).toLowerCase();


                        const placeholder =
                            (
                                el.getAttribute("placeholder") ||
                                ""
                            ).toLowerCase();


                        const aria =
                            (
                                el.getAttribute("aria-label") ||
                                ""
                            ).toLowerCase();


                        const autocomplete =
                            (
                                el.getAttribute("autocomplete") ||
                                ""
                            ).toLowerCase();


                        const inputMode =
                            (
                                el.getAttribute("inputmode") ||
                                ""
                            ).toLowerCase();


                        const nearbyText =
                            getNearbyText(el);


                        const combined = [

                            type,
                            name,
                            id,
                            placeholder,
                            aria,
                            autocomplete,
                            inputMode,
                            nearbyText

                        ]
                            .join(" ")
                            .toLowerCase();


                        const isPassword =
                            type === "password" ||
                            name.includes("password") ||
                            id.includes("password") ||
                            placeholder.includes("password") ||
                            aria.includes("password") ||
                            autocomplete.includes("password") ||
                            combined.includes("password") ||
                            combined.includes("passcode") ||
                            combined.includes("passwd") ||
                            combined.includes("pwd");


                        const isEmail =
                            type === "email" ||
                            combined.includes("email") ||
                            combined.includes("e-mail");


                        const isPhone =
                            inputMode === "tel" ||
                            type === "tel" ||
                            combined.includes("phone") ||
                            combined.includes("mobile") ||
                            combined.includes("telephone");


                        const isUPI =
                            combined.includes("upi") ||
                            combined.includes("vpa");


                        const isAadhaar =
                            combined.includes("aadhaar") ||
                            combined.includes("aadhar");


                        const isPAN =
                            combined.includes("pan");


                        const isAccount =
                            combined.includes("account") ||
                            combined.includes("bank account");


                        const isCard =
                            combined.includes("card") ||
                            combined.includes("credit card") ||
                            combined.includes("debit card") ||
                            combined.includes("cvv") ||
                            combined.includes("security code");


                        const sensitive =
                            isPassword ||
                            isEmail ||
                            isPhone ||
                            isUPI ||
                            isAadhaar ||
                            isPAN ||
                            isAccount ||
                            isCard;


                        if (!sensitive) {
                            return null;
                        }


                        const rect =
                            el.getBoundingClientRect();


                        return {

                            type:
                                el.getAttribute("type") ||
                                el.type ||
                                "",

                            name:
                                el.getAttribute("name") ||
                                "",

                            id:
                                el.getAttribute("id") ||
                                "",

                            placeholder:
                                el.getAttribute("placeholder") ||
                                "",

                            ariaLabel:
                                el.getAttribute("aria-label") ||
                                "",

                            autocomplete:
                                el.getAttribute("autocomplete") ||
                                "",

                            inputMode:
                                el.getAttribute("inputmode") ||
                                "",

                            nearbyText:
                                nearbyText,

                            x:
                                rect.left + frameX,

                            y:
                                rect.top + frameY,

                            width:
                                rect.width,

                            height:
                                rect.height,

                            reason:

                                isPassword
                                    ? "password"

                                    : isEmail
                                        ? "email"

                                        : isPhone
                                            ? "phone"

                                            : isUPI
                                                ? "upi"

                                                : isAadhaar
                                                    ? "aadhaar"

                                                    : isPAN
                                                        ? "pan"

                                                        : isAccount
                                                            ? "account"

                                                            : "card"
                        };

                    })

                    .filter(Boolean);
            }
        });


    const fields =
        results.flatMap(
            result =>
                result.result || []
        );


    console.log(
        "🔐 PRIVI-BROWSER detected fields:",
        fields
    );


    return fields;
}


// ============================================================
// 🛡️ PROTECT SCREEN
// THIS SECTION IS PRESERVED
// ============================================================

document
    .getElementById("protectBtn")
    .addEventListener(
        "click",
        async () => {

            try {

                const tab =
                    await getActiveTab();


                setStatus(
                    "📸 Capturing screen..."
                );


                const screenshot =
                    await chrome.tabs.captureVisibleTab(
                        null,
                        {
                            format: "png"
                        }
                    );


                const response =
                    await fetch(
                        screenshot
                    );


                const blob =
                    await response.blob();


                setStatus(
                    "🔎 Detecting sensitive information..."
                );


                const fields =
                    await getSensitiveFields(
                        tab.id
                    );


                const viewport =
                    await runOnPage(

                        tab.id,

                        () => {

                            return {

                                width:
                                    window.innerWidth,

                                height:
                                    window.innerHeight,

                                devicePixelRatio:
                                    window.devicePixelRatio

                            };

                        }
                    );


                const formData =
                    new FormData();


                formData.append(
                    "screenshot",
                    blob,
                    "screenshot.png"
                );


                formData.append(
                    "fields",
                    JSON.stringify(
                        fields || []
                    )
                );


                formData.append(
                    "viewportWidth",
                    viewport.width
                );


                formData.append(
                    "viewportHeight",
                    viewport.height
                );


                formData.append(
                    "devicePixelRatio",
                    viewport.devicePixelRatio
                );


                setStatus(
                    "🔐 Protecting sensitive information..."
                );


                const result =
                    await fetch(
                        "http://127.0.0.1:5000/protect",
                        {
                            method:
                                "POST",

                            body:
                                formData
                        }
                    );


                if (!result.ok) {

                    throw new Error(
                        "Privacy backend is not responding."
                    );
                }


                const protectedBlob =
                    await result.blob();


                const url =
                    URL.createObjectURL(
                        protectedBlob
                    );


                let image =
                    document.getElementById(
                        "protectedResult"
                    );


                if (!image) {

                    image =
                        document.createElement(
                            "img"
                        );

                    image.id =
                        "protectedResult";

                    image.style.width =
                        "100%";

                    image.style.marginTop =
                        "10px";

                    image.style.borderRadius =
                        "8px";

                    image.style.display =
                        "block";

                    document.body.appendChild(
                        image
                    );
                }


                image.src =
                    url;


                setStatus(
                    "✅ Protected screenshot ready!"
                );

            }
            catch (error) {

                console.error(
                    error
                );

                setStatus(
                    "❌ " +
                    error.message
                );
            }

        }
    );


// ============================================================
// 🤖 RUN AI TASK
// ============================================================

document
    .getElementById("runTaskBtn")
    .addEventListener(
        "click",
        async () => {

            const input =
                document.getElementById(
                    "taskInput"
                );


            const task =
                input.value.trim();


            if (!task) {

                setStatus(
                    "⚠️ Enter a task first."
                );

                return;
            }


            try {

                await executeTask(
                    task
                );

            }
            catch (error) {

                console.error(
                    error
                );

                setStatus(
                    "❌ " +
                    error.message
                );
            }

        }
    );


// ============================================================
// 🧠 EXECUTE AI TASK
// ============================================================

async function executeTask(task) {

    setStatus(
        "🧠 Creating action plan..."
    );


    const response =
        await fetch(
            "http://127.0.0.1:5000/plan",
            {

                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        task: task
                    })
            }
        );


    if (!response.ok) {

        throw new Error(
            "AI Planner backend is not responding."
        );
    }


    const data =
        await response.json();


    if (!data.success) {

        throw new Error(
            data.message ||
            "Could not create action plan."
        );
    }


    const plan =
        data.plan;


    if (
        !Array.isArray(plan) ||
        plan.length === 0
    ) {

        throw new Error(
            "No action plan was generated."
        );
    }


    console.log(
        "🤖 PRIVI-BROWSER PLAN:",
        plan
    );


    for (
        let i = 0;
        i < plan.length;
        i++
    ) {

        const step =
            plan[i];


        if (
            !step ||
            !step.action
        ) {
            continue;
        }


        const action =
            String(
                step.action
            )
                .toLowerCase()
                .trim();


        const target =
            String(
                step.target || ""
            )
                .trim();


        setStatus(
            `🤖 Step ${i + 1}/${plan.length}: ${action}`
        );


        let taskText = "";


        switch (action) {

          case "search_youtube":

    // If next action is PLAY,
    // search and open the first matching video.
    if (
        plan[i + 1] &&
        String(plan[i + 1].action).toLowerCase() === "play"
    ) {
        await searchAndPlay(target);

        // Give YouTube time to open the selected video
        await wait(5000);

        taskText = "";
    } else {
        taskText =
            `search youtube for ${target}`;
    }

    break;


            case "search_google":
                taskText =
                    `search google for ${target}`;
                break;


            case "play":
                taskText =
                    target
                        ? `play ${target}`
                        : "play";
                break;


            case "pause":
                taskText = "pause";
                break;


            case "stop":
                taskText = "stop";
                break;


            case "like":
                taskText = "like";
                break;


            case "unlike":
                taskText = "unlike";
                break;


            case "dislike":
                taskText = "dislike";
                break;


            case "subscribe":
                taskText = "subscribe";
                break;


            case "unsubscribe":
                taskText = "unsubscribe";
                break;


            case "follow":
                taskText = "follow";
                break;


            case "unfollow":
                taskText = "unfollow";
                break;


            case "share":
                taskText = "share";
                break;


            case "comment":
                taskText = "comment";
                break;


            case "save":
                taskText = "save";
                break;


            case "send":
                taskText = "send";
                break;


            case "mute":
                taskText = "mute";
                break;


            case "unmute":
                taskText = "unmute";
                break;


            case "volume_up":
            case "increase_volume":
            case "volumeup":
            case "increase_sound":
                taskText = "volume up";
                break;


            case "volume_down":
            case "decrease_volume":
            case "volumedown":
            case "decrease_sound":
                taskText = "volume down";
                break;


            case "seek_forward":
            case "fast_forward":
            case "forward_video":
                taskText = "seek forward";
                break;


            case "seek_backward":
            case "rewind":
            case "backward_video":
                taskText = "seek backward";
                break;


            case "forward":
                taskText = "forward";
                break;


            case "back":
            case "backward":
                taskText = "back";
                break;


            case "next":
                taskText = "next";
                break;


            case "previous":
                taskText = "previous";
                break;


            case "fullscreen":
                taskText = "fullscreen";
                break;


            case "refresh":
            case "reload":
                taskText = "refresh";
                break;


            case "scroll":
                taskText =
                    `scroll ${target}`;
                break;


            case "open":
                taskText =
                    `open ${target}`;
                break;


            case "click":
                taskText =
                    `click ${target}`;
                break;


            case "type":
                taskText =
                    `type ${target}`;
                break;


            default:
                taskText = task;
                break;
        }


        if (taskText) {

    console.log(
        "▶️ Executing:",
        taskText
    );

    await executeSingleTask(
        taskText
    );
}


        if (
            i <
            plan.length - 1
        ) {

            await wait(
                1200
            );
        }
    }


    setStatus(
        "✅ Task completed successfully."
    );
}


// ============================================================
// 🧠 NORMALIZE COMMAND
// ============================================================

function normalizeCommand(task) {

    let text =
        String(task || "")
            .toLowerCase()
            .trim();


    text =
        text
            .replace(/[!?.,]/g, " ")
            .replace(/\s+/g, " ")
            .trim();


    const replacements = {

        // like
        "liek": "like",
        "laik": "like",
        "lik": "like",
        "lke": "like",

        // unlike
        "unlke": "unlike",
        "unlik": "unlike",

        // subscribe
        "subcribe": "subscribe",
        "subscrib": "subscribe",
        "subs": "subscribe",

        // unsubscribe
        "unsubcribe": "unsubscribe",
        "unsubscrib": "unsubscribe",

        // follow
        "folow": "follow",
        "follw": "follow",
        "fllow": "follow",

        // unfollow
        "unfolow": "unfollow",
        "unfollw": "unfollow",

        // comment
        "commment": "comment",
        "comnt": "comment",

        // share
        "shre": "share",

        // save
        "sav": "save",

        // mute
        "mte": "mute",

        // volume
        "volum": "volume",

        // forward
        "forwad": "forward",
        "foward": "forward",

        // backward
        "backwad": "backward",
        "backword": "backward",

        // previous
        "previos": "previous",
        "previus": "previous",

        // refresh
        "refesh": "refresh",
        "relod": "reload"
    };


    for (
        const wrong in replacements
    ) {

        text =
            text.replace(
                new RegExp(
                    `\\b${wrong}\\b`,
                    "g"
                ),
                replacements[wrong]
            );
    }


    return text;
}


// ============================================================
// 🤖 SINGLE TASK EXECUTOR
// ============================================================

async function executeSingleTask(task) {

    const lower =
        normalizeCommand(task);


    const tab =
        await getActiveTab();


    const isYouTube =
        String(tab.url || "")
            .toLowerCase()
            .includes("youtube.com");


    // ========================================================
    // UNLIKE
    // ========================================================

    if (
        lower === "unlike" ||
        lower.includes("unlike this") ||
        lower.includes("remove like") ||
        lower.includes("remove the like") ||
        lower.includes("unlike the post") ||
        lower.includes("unlike the video")
    ) {

        const result =
            await smartUnlike(
                tab.id
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "👎 " + result.message
        );

        return;
    }


    // ========================================================
    // DISLIKE
    // ========================================================

    if (
        lower === "dislike" ||
        lower.includes("dislike this") ||
        lower.includes("dislike the video") ||
        lower.includes("give it a dislike") ||
        lower.includes("click dislike")
    ) {

        if (!isYouTube) {

            const result =
                await smartClick(
                    tab.id,
                    "dislike"
                );

            if (!result.success) {
                throw new Error(result.message);
            }

            setStatus(
                "👎 " + result.message
            );

            return;
        }


        const result =
            await youtubeDislike(
                tab.id
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "👎 " + result.message
        );

        return;
    }


    // ========================================================
    // UNSUBSCRIBE
    // ========================================================

    if (
        lower === "unsubscribe" ||
        lower.includes("unsubscribe") ||
        lower.includes("un subscribe") ||
        lower.includes("cancel subscription")
    ) {

        const result =
            await smartUnsubscribe(
                tab.id
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "🔕 " + result.message
        );

        return;
    }


    // ========================================================
    // UNFOLLOW
    // ========================================================

    if (
        lower === "unfollow" ||
        lower.includes("unfollow this") ||
        lower.includes("unfollow account") ||
        lower.includes("stop following") ||
        lower.includes("remove follow")
    ) {

        const result =
            await smartClick(
                tab.id,
                "unfollow"
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "👤 " + result.message
        );

        return;
    }


    // ========================================================
    // BACK - BROWSER
    // ========================================================

    if (
        lower === "back" ||
        lower.includes("go back") ||
        lower.includes("previous page") ||
        lower.includes("go to previous page")
    ) {

        try {

            await chrome.tabs.goBack(
                tab.id
            );

            setStatus(
                "◀️ Going back..."
            );

        }
        catch (error) {

            throw new Error(
                "Cannot go back from this page."
            );
        }

        return;
    }


    // ========================================================
    // FORWARD - BROWSER
    // ========================================================

    if (
        lower === "forward" ||
        lower.includes("go forward") ||
        lower.includes("next page") ||
        lower.includes("go to next page")
    ) {

        try {

            await chrome.tabs.goForward(
                tab.id
            );

            setStatus(
                "▶️ Going forward..."
            );

        }
        catch (error) {

            throw new Error(
                "Cannot go forward from this page."
            );
        }

        return;
    }


    // ========================================================
    // REFRESH
    // ========================================================

    if (
        lower === "refresh" ||
        lower === "reload" ||
        lower.includes("refresh page") ||
        lower.includes("reload page")
    ) {

        await chrome.tabs.reload(
            tab.id
        );

        setStatus(
            "🔄 Refreshing..."
        );

        return;
    }


    // ========================================================
    // SCROLL DOWN
    // ========================================================

    if (
        lower.includes("scroll down") ||
        lower.includes("scroll more") ||
        lower.includes("show more") ||
        lower.includes("more posts") ||
        lower.includes("more videos") ||
        lower.includes("go down") ||
        lower.includes("move down")
    ) {

        await runOnPage(
            tab.id,
            () => {
                window.scrollBy({
                    top: 700,
                    behavior: "smooth"
                });
            }
        );

        setStatus(
            "📜 Scrolling down..."
        );

        return;
    }


    // ========================================================
    // SCROLL UP
    // ========================================================

    if (
        lower.includes("scroll up") ||
        lower.includes("go up") ||
        lower.includes("move up") ||
        lower.includes("scroll higher")
    ) {

        await runOnPage(
            tab.id,
            () => {
                window.scrollBy({
                    top: -700,
                    behavior: "smooth"
                });
            }
        );

        setStatus(
            "📜 Scrolling up..."
        );

        return;
    }


    // ========================================================
    // PLAY
    // ========================================================

    if (
        lower === "play" ||
        lower === "resume" ||
        lower === "play video" ||
        lower === "resume video" ||
        lower.includes("play the video") ||
        lower.includes("play this video") ||
        lower.includes("resume the video") ||
        lower.includes("continue playing") ||
        lower.includes("start playing")
    ) {

        await videoAction(
            tab.id,
            "play"
        );

        setStatus(
            "▶️ Video playing."
        );

        return;
    }


    // ========================================================
    // PAUSE
    // ========================================================

    if (
        lower === "pause" ||
        lower === "pause video" ||
        lower.includes("pause the video") ||
        lower.includes("pause this video") ||
        lower.includes("stop playing") ||
        lower.includes("hold the video")
    ) {

        await videoAction(
            tab.id,
            "pause"
        );

        setStatus(
            "⏸️ Video paused."
        );

        return;
    }


    // ========================================================
    // STOP
    // ========================================================

    if (
        lower === "stop" ||
        lower.includes("stop video") ||
        lower.includes("stop playback")
    ) {

        await videoAction(
            tab.id,
            "stop"
        );

        setStatus(
            "⏹️ Video stopped."
        );

        return;
    }


    // ========================================================
    // MUTE
    // ========================================================

    if (
        lower === "mute" ||
        lower.includes("mute video") ||
        lower.includes("mute the video") ||
        lower.includes("turn sound off") ||
        lower.includes("turn off sound") ||
        lower.includes("silence the video") ||
        lower.includes("make it silent")
    ) {

        await videoAction(
            tab.id,
            "mute"
        );

        setStatus(
            "🔇 Video muted."
        );

        return;
    }


    // ========================================================
    // UNMUTE
    // ========================================================

    if (
        lower === "unmute" ||
        lower.includes("unmute video") ||
        lower.includes("turn sound on") ||
        lower.includes("turn on sound") ||
        lower.includes("enable sound") ||
        lower.includes("sound on")
    ) {

        await videoAction(
            tab.id,
            "unmute"
        );

        setStatus(
            "🔊 Sound enabled."
        );

        return;
    }


    // ========================================================
    // VOLUME UP
    // ========================================================

    if (
        lower === "volume up" ||
        lower.includes("increase volume") ||
        lower.includes("increase sound") ||
        lower.includes("raise volume") ||
        lower.includes("make it louder") ||
        lower.includes("sound up") ||
        lower.includes("louder") ||
        lower.includes("more volume")
    ) {

        await videoVolume(
            tab.id,
            "up"
        );

        setStatus(
            "🔊 Volume increased."
        );

        return;
    }


    // ========================================================
    // VOLUME DOWN
    // ========================================================

    if (
        lower === "volume down" ||
        lower.includes("decrease volume") ||
        lower.includes("decrease sound") ||
        lower.includes("lower volume") ||
        lower.includes("make it quieter") ||
        lower.includes("sound down") ||
        lower.includes("quieter") ||
        lower.includes("less volume")
    ) {

        await videoVolume(
            tab.id,
            "down"
        );

        setStatus(
            "🔉 Volume decreased."
        );

        return;
    }


    // ========================================================
    // SEEK FORWARD
    // ========================================================

    if (
        lower.includes("seek forward") ||
        lower.includes("fast forward") ||
        lower.includes("forward the video") ||
        lower.includes("skip forward") ||
        lower.includes("forward in the video") ||
        lower.includes("move forward in the video")
    ) {

        await seekVideo(
            tab.id,
            extractSeconds(lower, 10)
        );

        setStatus(
            "⏩ Video moved forward."
        );

        return;
    }


    // ========================================================
    // SEEK BACKWARD
    // ========================================================

    if (
        lower.includes("seek backward") ||
        lower.includes("rewind") ||
        lower.includes("skip backward") ||
        lower.includes("backward in the video") ||
        lower.includes("move backward in the video")
    ) {

        await seekVideo(
            tab.id,
            -extractSeconds(lower, 10)
        );

        setStatus(
            "⏪ Video moved backward."
        );

        return;
    }


    // ========================================================
    // NEXT
    // ========================================================

    if (
        lower === "next" ||
        lower.includes("next video") ||
        lower.includes("play next video") ||
        lower.includes("go to next video")
    ) {

        if (isYouTube) {

            const result =
                await youtubeControl(
                    tab.id,
                    "next"
                );

            if (!result.success) {
                throw new Error(result.message);
            }

        }
        else {

            const result =
                await smartClick(
                    tab.id,
                    "next"
                );

            if (!result.success) {
                throw new Error(result.message);
            }
        }

        setStatus(
            "⏭️ Next action completed."
        );

        return;
    }


    // ========================================================
    // PREVIOUS
    // ========================================================

    if (
        lower === "previous" ||
        lower.includes("previous video") ||
        lower.includes("previous post") ||
        lower.includes("go to previous video")
    ) {

        if (isYouTube) {

            const result =
                await youtubeControl(
                    tab.id,
                    "previous"
                );

            if (!result.success) {
                throw new Error(result.message);
            }

        }
        else {

            const result =
                await smartClick(
                    tab.id,
                    "previous"
                );

            if (!result.success) {
                throw new Error(result.message);
            }
        }

        setStatus(
            "⏮️ Previous action completed."
        );

        return;
    }


    // ========================================================
    // FULLSCREEN
    // ========================================================

    if (
        lower.includes("fullscreen") ||
        lower.includes("full screen") ||
        lower.includes("make video full screen") ||
        lower.includes("expand video")
    ) {

        if (isYouTube) {

            const result =
                await youtubeControl(
                    tab.id,
                    "fullscreen"
                );

            if (!result.success) {
                throw new Error(result.message);
            }

        }
        else {

            await runOnPage(
                tab.id,
                () => {

                    const video =
                        document.querySelector("video");

                    if (!video) {
                        return false;
                    }

                    if (video.requestFullscreen) {
                        video.requestFullscreen();
                        return true;
                    }

                    return false;
                }
            );
        }

        setStatus(
            "🔲 Fullscreen."
        );

        return;
    }


    // ========================================================
    // LIKE
    // ========================================================

    if (
        lower === "like" ||
        lower.includes("like this") ||
        lower.includes("like the post") ||
        lower.includes("like the video") ||
        lower.includes("give it a like") ||
        lower.includes("click like") ||
        lower.includes("press like") ||
        lower.includes("tap like")
    ) {

        const result =
            await smartLike(
                tab.id
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "👍 " + result.message
        );

        return;
    }


    // ========================================================
    // SUBSCRIBE
    // ========================================================

    if (
        lower === "subscribe" ||
        lower.includes("subscribe to") ||
        lower.includes("subscribe channel") ||
        lower.includes("click subscribe") ||
        lower.includes("press subscribe")
    ) {

        const result =
            await smartSubscribe(
                tab.id
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "🔔 " + result.message
        );

        return;
    }


    // ========================================================
    // FOLLOW
    // ========================================================

    if (
        lower === "follow" ||
        lower.includes("follow this") ||
        lower.includes("follow account") ||
        lower.includes("follow the account") ||
        lower.includes("follow this person") ||
        lower.includes("click follow") ||
        lower.includes("press follow") ||
        lower.includes("tap follow")
    ) {

        const result =
            await smartClick(
                tab.id,
                "follow"
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "👤 " + result.message
        );

        return;
    }


    // ========================================================
    // SHARE
    // ========================================================

    if (
        lower === "share" ||
        lower.includes("share this") ||
        lower.includes("share the post") ||
        lower.includes("share the video") ||
        lower.includes("click share") ||
        lower.includes("press share") ||
        lower.includes("tap share")
    ) {

        const result =
            await smartClick(
                tab.id,
                "share"
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "↗️ " + result.message
        );

        return;
    }


    // ========================================================
    // COMMENT
    // ========================================================

    if (
        lower === "comment" ||
        lower.includes("open comments") ||
        lower.includes("show comments") ||
        lower.includes("click comment") ||
        lower.includes("press comment") ||
        lower.includes("tap comment")
    ) {

        const result =
            await smartClick(
                tab.id,
                "comment"
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "💬 " + result.message
        );

        return;
    }


    // ========================================================
    // SAVE
    // ========================================================

    if (
        lower === "save" ||
        lower.includes("save this") ||
        lower.includes("save the post") ||
        lower.includes("save the video") ||
        lower.includes("bookmark this") ||
        lower.includes("bookmark it") ||
        lower.includes("click save")
    ) {

        const result =
            await smartClick(
                tab.id,
                "save"
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "🔖 " + result.message
        );

        return;
    }


    // ========================================================
    // SEND
    // ========================================================

    if (
        lower === "send" ||
        lower.includes("click send") ||
        lower.includes("press send") ||
        lower.includes("tap send")
    ) {

        const result =
            await smartClick(
                tab.id,
                "send"
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "📨 " + result.message
        );

        return;
    }


    // ========================================================
    // PLAY / WATCH SEARCH
    // ========================================================

    if (
        lower.startsWith("play ") ||
        lower.startsWith("watch ")
    ) {

        const query =
            task.replace(
                /^(play|watch)\s+/i,
                ""
            ).trim();


        if (!query) {
            throw new Error(
                "Tell me what you want to play."
            );
        }


        await searchAndPlay(
            query
        );

        return;
    }


    // ========================================================
    // SEARCH YOUTUBE
    // ========================================================

    if (
        lower.startsWith("search youtube") ||
        lower.startsWith("youtube search") ||
        lower.startsWith("find on youtube") ||
        lower.startsWith("search on youtube")
    ) {

        const query =
            task.replace(
                /^.*?(?:search youtube|youtube search|find on youtube|search on youtube)(?:\s+for)?\s*/i,
                ""
            ).trim();


        if (!query) {
            throw new Error(
                "Tell me what to search."
            );
        }


        await chrome.tabs.update(

            tab.id,

            {
                url:
                    "https://www.youtube.com/results?search_query=" +
                    encodeURIComponent(query)
            }
        );


        setStatus(
            "🔎 Searching YouTube..."
        );

        return;
    }


    // ========================================================
    // SEARCH GOOGLE
    // ========================================================

    if (
        lower.startsWith("search google") ||
        lower.startsWith("search for") ||
        lower.startsWith("find on google") ||
        lower.startsWith("search on google")
    ) {

        const query =
            task.replace(
                /^.*?(?:search google|search for|find on google|search on google|search)(?:\s+for)?\s*/i,
                ""
            ).trim();


        if (!query) {
            throw new Error(
                "Tell me what to search."
            );
        }


        await chrome.tabs.update(

            tab.id,

            {
                url:
                    "https://www.google.com/search?q=" +
                    encodeURIComponent(query)
            }
        );


        setStatus(
            "🔎 Searching Google..."
        );

        return;
    }


    // ========================================================
    // OPEN WEBSITES
    // ========================================================

    const websites = {

        google:
            "https://www.google.com",

        youtube:
            "https://www.youtube.com",

        gmail:
            "https://mail.google.com",

        instagram:
            "https://www.instagram.com",

        facebook:
            "https://www.facebook.com",

        linkedin:
            "https://www.linkedin.com",

        amazon:
            "https://www.amazon.in",

        flipkart:
            "https://www.flipkart.com",

        github:
            "https://github.com",

        chatgpt:
            "https://chatgpt.com",

        spotify:
            "https://open.spotify.com",

        netflix:
            "https://www.netflix.com"
    };


    for (
        const site in websites
    ) {

        if (
            lower === `open ${site}` ||
            lower === `go to ${site}` ||
            lower === `open ${site}.com` ||
            lower === `go to ${site}.com` ||
            lower.includes(`open ${site} website`) ||
            lower.includes(`go to ${site} website`)
        ) {

            await chrome.tabs.update(

                tab.id,

                {
                    url:
                        websites[site]
                }
            );


            setStatus(
                `🌐 Opening ${site}...`
            );

            return;
        }
    }


    // ========================================================
    // CLICK / PRESS / TAP / SELECT
    // ========================================================

    if (
        lower.startsWith("click ") ||
        lower.startsWith("press ") ||
        lower.startsWith("tap ") ||
        lower.startsWith("select ")
    ) {

        const target =
            task.replace(
                /^(click|press|tap|select)\s+/i,
                ""
            ).trim();


        if (!target) {
            throw new Error(
                "Tell me what you want me to click."
            );
        }


        const targetLower =
            normalizeCommand(target);


        // NEVER use YouTube handler on Instagram/Facebook/etc.
        if (
            targetLower.includes("dislike")
        ) {

            if (isYouTube) {

                const result =
                    await youtubeDislike(
                        tab.id
                    );

                if (!result.success) {
                    throw new Error(result.message);
                }

                setStatus(
                    "👎 " + result.message
                );

                return;
            }
        }


        if (
            targetLower === "like" ||
            targetLower.includes("like button")
        ) {

            const result =
                await smartLike(
                    tab.id
                );

            if (!result.success) {
                throw new Error(result.message);
            }

            setStatus(
                "👍 " + result.message
            );

            return;
        }


        if (
            targetLower.includes("unlike")
        ) {

            const result =
                await smartUnlike(
                    tab.id
                );

            if (!result.success) {
                throw new Error(result.message);
            }

            setStatus(
                "👎 " + result.message
            );

            return;
        }


        if (
            targetLower.includes("subscribe")
        ) {

            const result =
                targetLower.includes("unsub")
                    ? await smartUnsubscribe(tab.id)
                    : await smartSubscribe(tab.id);


            if (!result.success) {
                throw new Error(result.message);
            }


            setStatus(
                "🔔 " + result.message
            );

            return;
        }


        if (
            targetLower.includes("unfollow")
        ) {

            const result =
                await smartClick(
                    tab.id,
                    "unfollow"
                );


            if (!result.success) {
                throw new Error(result.message);
            }


            setStatus(
                "👤 " + result.message
            );

            return;
        }


        if (
            targetLower.includes("follow")
        ) {

            const result =
                await smartClick(
                    tab.id,
                    "follow"
                );


            if (!result.success) {
                throw new Error(result.message);
            }


            setStatus(
                "👤 " + result.message
            );

            return;
        }


        const result =
            await smartClick(
                tab.id,
                target
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            `🖱️ ${result.message}`
        );

        return;
    }


    // ========================================================
    // TYPE
    // ========================================================

    if (
        lower.startsWith("type ") ||
        lower.startsWith("enter ") ||
        lower.startsWith("write ") ||
        lower.startsWith("fill ")
    ) {

        const text =
            task.replace(
                /^(type|enter|write|fill)\s+/i,
                ""
            ).trim();


        if (!text) {
            throw new Error(
                "Tell me what text to enter."
            );
        }


        const result =
            await smartType(
                tab.id,
                text
            );


        if (!result.success) {
            throw new Error(result.message);
        }


        setStatus(
            "⌨️ Text entered."
        );

        return;
    }


    // ========================================================
    // GENERIC FALLBACK
    // ========================================================

    const generic =
        await smartClick(
            tab.id,
            task
        );


    if (generic.success) {

        setStatus(
            "🖱️ " + generic.message
        );

        return;
    }


    throw new Error(
        "I couldn't understand that task yet."
    );
}


// ============================================================
// ⏱️ EXTRACT SECONDS
// ============================================================

function extractSeconds(
    text,
    defaultSeconds = 10
) {

    const match =
        text.match(
            /(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i
        );


    if (!match) {
        return defaultSeconds;
    }


    const seconds =
        Number(
            match[1]
        );


    if (
        !Number.isFinite(seconds) ||
        seconds <= 0
    ) {
        return defaultSeconds;
    }


    return Math.min(
        seconds,
        300
    );
}


// ============================================================
// 🎥 VIDEO ACTION
// ============================================================

async function videoAction(
    tabId,
    action
) {

    const result =
        await runOnPage(

            tabId,

            async action => {

                const videos =
                    Array.from(
                        document.querySelectorAll(
                            "video"
                        )
                    );


                const video =
                    videos.find(
                        v =>
                            v.offsetWidth > 0 &&
                            v.offsetHeight > 0
                    ) ||
                    videos[0];


                if (!video) {

                    return {

                        success:
                            false,

                        message:
                            "No video found on this page."
                    };
                }


                try {

                    if (
                        action === "play"
                    ) {

                        await video.play();

                        return {
                            success:
                                !video.paused
                        };
                    }


                    if (
                        action === "pause"
                    ) {

                        video.pause();

                        return {
                            success:
                                video.paused
                        };
                    }


                    if (
                        action === "stop"
                    ) {

                        video.pause();

                        video.currentTime =
                            0;

                        return {
                            success:
                                video.paused
                        };
                    }


                    if (
                        action === "mute"
                    ) {

                        video.muted =
                            true;

                        return {
                            success:
                                video.muted
                        };
                    }


                    if (
                        action === "unmute"
                    ) {

                        video.muted =
                            false;

                        return {
                            success:
                                !video.muted
                        };
                    }

                }
                catch (error) {

                    return {

                        success:
                            false,

                        message:
                            error.message
                    };
                }


                return {

                    success:
                        false,

                    message:
                        "Unknown video action."
                };

            },

            [action]
        );


    if (
        !result?.success
    ) {

        throw new Error(
            result?.message ||
            "Video action failed."
        );
    }
}


// ============================================================
// 🔊 VIDEO VOLUME
// ============================================================
async function videoVolume(tabId, direction) {
    const result = await runOnPage(
        tabId,
        (direction) => {

            const videos = Array.from(
                document.querySelectorAll("video")
            );

            const visibleVideos = videos.filter(video => {
                const rect = video.getBoundingClientRect();
                const style = getComputedStyle(video);

                return (
                    rect.width > 100 &&
                    rect.height > 100 &&
                    style.display !== "none" &&
                    style.visibility !== "hidden"
                );
            });

            if (visibleVideos.length === 0) {
                return {
                    success: false,
                    message: "No visible video found."
                };
            }

            const video = visibleVideos.sort((a, b) => {
                const aRect = a.getBoundingClientRect();
                const bRect = b.getBoundingClientRect();

                return (
                    (bRect.width * bRect.height) -
                    (aRect.width * aRect.height)
                );
            })[0];

            const oldVolume = video.volume;

            let newVolume;

            if (direction === "up") {
                newVolume = Math.min(
                    1,
                    oldVolume + 0.1
                );
            } else {
                newVolume = Math.max(
                    0,
                    oldVolume - 0.1
                );
            }

            video.volume = newVolume;

            video.dispatchEvent(
                new Event("volumechange", {
                    bubbles: true
                })
            );

            return {
                success: true,
                oldVolume: Math.round(oldVolume * 100),
                newVolume: Math.round(video.volume * 100)
            };
        },
        [direction]
    );

    if (!result || !result.success) {
        throw new Error(
            result?.message ||
            "Volume change failed."
        );
    }

    setStatus(
        direction === "up"
            ? `🔊 Volume increased to ${result.newVolume}%`
            : `🔉 Volume decreased to ${result.newVolume}%`
    );
}
        
   
           
       


    
               


// ============================================================
// ⏩ SEEK VIDEO
// ============================================================

async function seekVideo(
    tabId,
    seconds
) {

    const result =
        await runOnPage(

            tabId,

            seconds => {

                const video =
                    document.querySelector(
                        "video"
                    );


                if (!video) {

                    return {

                        success:
                            false,

                        message:
                            "No video found."
                    };
                }


                const duration =
                    Number.isFinite(
                        video.duration
                    )
                        ? video.duration
                        : Infinity;


                const newTime =
                    Math.max(
                        0,
                        Math.min(
                            duration,
                            video.currentTime + seconds
                        )
                    );


                video.currentTime =
                    newTime;


                return {

                    success:
                        true,

                    currentTime:
                        video.currentTime
                };

            },

            [seconds]
        );


    if (
        !result?.success
    ) {

        throw new Error(
            result?.message ||
            "Video seek failed."
        );
    }
}


// ============================================================
// ▶️ YOUTUBE CONTROL
// ============================================================

async function youtubeControl(
    tabId,
    action
) {

    return await runOnPage(

        tabId,

        action => {

            const selectors = {

                next: [
                    ".ytp-next-button",
                    "button[aria-label*='Next']",
                    "[aria-label='Next']"
                ],

                previous: [
                    ".ytp-prev-button",
                    "button[aria-label*='Previous']",
                    "[aria-label='Previous']"
                ],

                fullscreen: [
                    ".ytp-fullscreen-button",
                    "button[aria-label*='Full screen']",
                    "button[aria-label*='Fullscreen']",
                    "[aria-label*='Full screen']"
                ]
            };


            const selectorList =
                selectors[action] || [];


            let button =
                null;


            for (
                const selector
                of selectorList
            ) {

                const found =
                    Array.from(
                        document.querySelectorAll(
                            selector
                        )
                    ).find(
                        el =>
                            isElementVisible(el)
                    );


                if (found) {

                    button =
                        found;

                    break;
                }
            }


            if (!button) {

                return {

                    success:
                        false,

                    message:
                        `${action} button not found.`
                };
            }


            button.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            setTimeout(
                () => button.click(),
                400
            );


            return {
                success:
                    true
            };

        },

        [action]
    );
}


// ============================================================
// ❤️ SMART LIKE
// ============================================================

async function smartLike(
    tabId
) {

    const tab =
        await getActiveTab();


    const url =
        String(
            tab.url || ""
        ).toLowerCase();


    // YouTube only gets the dedicated YouTube detector
    if (
        url.includes("youtube.com")
    ) {

        return await youtubeLike(
            tabId
        );
    }


    // Instagram / Facebook / LinkedIn / other websites
    return await smartClick(
        tabId,
        "like"
    );
}


// ============================================================
// ❤️ YOUTUBE LIKE
// ============================================================

async function youtubeLike(
    tabId
) {

    return await runOnPage(

        tabId,

        async () => {

            const candidates =
                Array.from(
                    document.querySelectorAll(
                        "button, [role='button']"
                    )
                );


            function labelOf(el) {

                return [
                    el.innerText,
                    el.textContent,
                    el.getAttribute("aria-label"),
                    el.getAttribute("title"),
                    el.getAttribute("data-testid")
                ]
                    .filter(Boolean)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
            }


            let button =
                null;


            let bestScore =
                -1;


            for (
                const element
                of candidates
            ) {

                if (
                    !isElementVisible(element)
                ) {
                    continue;
                }


                const label =
                    labelOf(element);


                if (
                    label.includes("dislike")
                ) {
                    continue;
                }


                if (
                    label.includes("remove like")
                ) {
                    return {
                        success:
                            true,
                        message:
                            "Video is already liked."
                    };
                }


                let score =
                    0;


                if (
                    label === "like"
                ) {
                    score += 150;
                }


                if (
                    label.includes(
                        "like this video"
                    )
                ) {
                    score += 120;
                }


                if (
                    label.includes("like")
                ) {
                    score += 60;
                }


                if (
                    element.closest(
                        "ytd-segmented-like-dislike-button-renderer"
                    )
                ) {
                    score += 80;
                }


                if (
                    element.matches(
                        "#segmented-like-button button"
                    )
                ) {
                    score += 80;
                }


                if (
                    element.getAttribute(
                        "aria-pressed"
                    ) === "true"
                ) {
                    return {
                        success:
                            true,
                        message:
                            "Video is already liked."
                    };
                }


                if (
                    score > bestScore
                ) {

                    bestScore =
                        score;

                    button =
                        element;
                }
            }


            if (!button) {

                return {

                    success:
                        false,

                    message:
                        "YouTube Like button not found."
                };
            }


            button.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        600
                    )
            );


            button.click();


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        800
                    )
            );


            return {

                success:
                    true,

                message:
                    "Video liked."
            };

        }
    );
}


async function youtubeDislike() {

    const tab = await getActiveTab();

    const result = await runOnPage(
        tab.id,
        async () => {

            function visible(el) {
                const r = el.getBoundingClientRect();
                const s = window.getComputedStyle(el);

                return (
                    r.width > 0 &&
                    r.height > 0 &&
                    s.display !== "none" &&
                    s.visibility !== "hidden"
                );
            }

            function getText(el) {
                return [
                    el.getAttribute("aria-label"),
                    el.getAttribute("title"),
                    el.innerText,
                    el.textContent
                ]
                    .filter(Boolean)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
            }

            function findDislike() {

                // YouTube's video action area
                const videoArea =
                    document.querySelector(
                        "ytd-watch-metadata"
                    );

                if (videoArea) {

                    const buttons =
                        Array.from(
                            videoArea.querySelectorAll(
                                "button, [role='button']"
                            )
                        );

                    const button =
                        buttons.find(el => {

                            if (!visible(el))
                                return false;

                            const text =
                                getText(el);

                            return (
                                text.includes(
                                    "dislike this video"
                                ) ||
                                text === "dislike" ||
                                text.startsWith(
                                    "dislike "
                                )
                            );
                        });

                    if (button)
                        return button;
                }

                // Fallback search
                const buttons =
                    Array.from(
                        document.querySelectorAll(
                            "button, [role='button']"
                        )
                    );

                return buttons.find(el => {

                    if (!visible(el))
                        return false;

                    const text =
                        getText(el);

                    return (
                        text.includes(
                            "dislike this video"
                        ) ||
                        text === "dislike" ||
                        text.startsWith(
                            "dislike "
                        )
                    );
                });
            }

            let button = null;

            // Wait for YouTube buttons to load
            for (
                let attempt = 0;
                attempt < 20;
                attempt++
            ) {

                button = findDislike();

                if (button)
                    break;

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            500
                        )
                );
            }

            if (!button) {

                return {
                    success: false,
                    message:
                        "YouTube Dislike button not found."
                };
            }

            // Already disliked?
            if (
                button.getAttribute(
                    "aria-pressed"
                ) === "true"
            ) {

                return {
                    success: true,
                    message:
                        "Video is already disliked."
                };
            }

            button.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        500
                    )
            );

            // Click dislike
            button.click();

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1500
                    )
            );

            // Check state again
            const newButton =
                findDislike();

            if (newButton) {

                const pressed =
                    newButton.getAttribute(
                        "aria-pressed"
                    );

                if (pressed === "true") {

                    return {
                        success: true,
                        message:
                            "Video disliked successfully."
                    };
                }
            }

            // If YouTube changed the button but
            // doesn't expose aria-pressed
            return {
                success: true,
                message:
                    "Dislike button clicked successfully."
            };
        }
    );

    if (!result?.success) {

        throw new Error(
            result?.message ||
            "Dislike action failed."
        );
    }
}


// ============================================================
// 🔔 SMART SUBSCRIBE
// ============================================================

async function smartSubscribe(
    tabId
) {

    const tab =
        await getActiveTab();


    const url =
        String(
            tab.url || ""
        ).toLowerCase();


    if (
        url.includes("youtube.com")
    ) {

        return await youtubeSubscribe(
            tabId
        );
    }


    return await smartClick(
        tabId,
        "subscribe"
    );
}


// ============================================================
// 🔔 YOUTUBE SUBSCRIBE
// ============================================================

async function youtubeSubscribe(
    tabId
) {

    return await runOnPage(

        tabId,

        async () => {

            const candidates =
                Array.from(
                    document.querySelectorAll(
                        [
                            "ytd-subscribe-button-renderer button",
                            "ytd-subscribe-button-renderer [role='button']",
                            "#subscribe-button button",
                            "#subscribe-button [role='button']",
                            "button",
                            "[role='button']"
                        ].join(",")
                    )
                );


            function labelOf(el) {

                return [
                    el.innerText,
                    el.textContent,
                    el.getAttribute("aria-label"),
                    el.getAttribute("title"),
                    el.getAttribute("data-testid")
                ]
                    .filter(Boolean)
                    .join(" ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
            }


            let button =
                null;


            let bestScore =
                -1;


            for (
                const element
                of candidates
            ) {

                if (
                    !isElementVisible(element)
                ) {
                    continue;
                }


                const label =
                    labelOf(element);


                if (
                    label.includes("subscribed")
                ) {
                    continue;
                }


                let score =
                    0;


                if (
                    label === "subscribe"
                ) {
                    score += 150;
                }


                if (
                    label.includes("subscribe")
                ) {
                    score += 80;
                }


                if (
                    element.closest(
                        "ytd-subscribe-button-renderer"
                    )
                ) {
                    score += 70;
                }


                if (
                    element.closest(
                        "#subscribe-button"
                    )
                ) {
                    score += 70;
                }


                if (
                    score > bestScore
                ) {

                    bestScore =
                        score;

                    button =
                        element;
                }
            }


            if (!button) {

                return {

                    success:
                        false,

                    message:
                        "YouTube Subscribe button not found."
                };
            }


            button.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        600
                    )
            );


            button.click();


            return {

                success:
                    true,

                message:
                    "Subscribe action completed."
            };

        }
    );
}


// ============================================================
// 🔕 SMART UNSUBSCRIBE
// ============================================================

async function smartUnsubscribe(
    tabId
) {

    const tab =
        await getActiveTab();


    const url =
        String(
            tab.url || ""
        ).toLowerCase();


    if (
        url.includes("youtube.com")
    ) {

        return await runOnPage(

            tabId,

            () => {

                const elements =
                    Array.from(
                        document.querySelectorAll(
                            "button, [role='button']"
                        )
                    );


                const button =
                    elements.find(
                        el => {

                            if (
                                !isElementVisible(el)
                            ) {
                                return false;
                            }


                            const text =
                                [
                                    el.innerText,
                                    el.textContent,
                                    el.getAttribute("aria-label"),
                                    el.getAttribute("title")
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .toLowerCase();


                            return (
                                text.includes("subscribed") &&
                                !text.includes("subscribe")
                            );
                        }
                    );


                if (!button) {

                    return {

                        success:
                            false,

                        message:
                            "Subscribed button not found."
                    };
                }


                button.click();


                return {

                    success:
                        true,

                    message:
                        "Unsubscribe action completed."
                };
            }
        );
    }


    return await smartClick(
        tabId,
        "unsubscribe"
    );
}


// ============================================================
// 👎 SMART UNLIKE
// ============================================================

async function smartUnlike(
    tabId
) {

    const tab =
        await getActiveTab();


    const url =
        String(
            tab.url || ""
        ).toLowerCase();


    if (
        url.includes("youtube.com")
    ) {

        return await runOnPage(

            tabId,

            () => {

                const elements =
                    Array.from(
                        document.querySelectorAll(
                            "button, [role='button']"
                        )
                    );


                const button =
                    elements.find(
                        el => {

                            if (
                                !isElementVisible(el)
                            ) {
                                return false;
                            }


                            const label =
                                [
                                    el.innerText,
                                    el.textContent,
                                    el.getAttribute("aria-label"),
                                    el.getAttribute("title")
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .toLowerCase();


                            return (
                                (
                                    label.includes("like")
                                ) &&
                                !label.includes("dislike") &&
                                (
                                    el.getAttribute("aria-pressed") === "true" ||
                                    label.includes("remove like")
                                )
                            );
                        }
                    );


                if (!button) {

                    return {

                        success:
                            false,

                        message:
                            "Liked button not found."
                    };
                }


                button.click();


                return {

                    success:
                        true,

                    message:
                        "Like removed."
                };
            }
        );
    }


    return await smartClick(
        tabId,
        "unlike"
    );
}
// ============================================================
// 🔎 SEARCH AND PLAY
// ============================================================

async function searchAndPlay(query) {

    const tab = await getActiveTab();

    setStatus(
        `🔎 Finding ${query}...`
    );

    // Open YouTube search
    await chrome.tabs.update(
        tab.id,
        {
            url:
                "https://www.youtube.com/results?search_query=" +
                encodeURIComponent(query)
        }
    );

    // Give YouTube time to load
    let videoUrl = null;

    for (let attempt = 0; attempt < 20; attempt++) {

        await wait(1000);

        videoUrl = await runOnPage(
            tab.id,
            () => {

                const videos =
                    Array.from(
                        document.querySelectorAll(
                            "a#video-title, a#video-title-link"
                        )
                    );

                const visible =
                    videos.find(
                        video =>
                            video.offsetParent !== null &&
                            video.href &&
                            video.href.includes("watch")
                    );

                return visible
                    ? visible.href
                    : null;
            }
        );

        if (videoUrl) {
            break;
        }
    }

    // No video after 20 seconds
    if (!videoUrl) {

        throw new Error(
            "Requested video was not found."
        );
    }

    // Open the actual YouTube video
    await chrome.tabs.update(
        tab.id,
        {
            url: videoUrl
        }
    );

    setStatus(
        `▶️ Opening ${query}...`
    );

    // Wait for video page to load
    await wait(4000);

    // Actually play the video
    try {

        await videoAction(
            tab.id,
            "play"
        );

        setStatus(
            "▶️ Video playing."
        );

    }
    catch (error) {

        console.log(
            "Video opened, but autoplay was blocked:",
            error
        );

        setStatus(
            "▶️ Video opened. Click play if autoplay is blocked."
        );
    }
}
async function skipVideo(tabId, seconds = 10) {
    const result = await runOnPage(
        tabId,
        (seconds) => {
            const video = document.querySelector("video");

            if (!video) {
                return {
                    success: false,
                    message: "No video found."
                };
            }

            const oldTime = video.currentTime;

            video.currentTime = Math.min(
                video.duration || Infinity,
                video.currentTime + seconds
            );

            return {
                success: true,
                oldTime: Math.round(oldTime),
                newTime: Math.round(video.currentTime)
            };
        },
        [seconds]
    );

    if (!result?.success) {
        throw new Error(
            result?.message || "Could not skip video."
        );
    }

    setStatus(
        `⏭️ Skipped ${result.newTime - result.oldTime} seconds`
    );
}





// ============================================================
// 🖱️ ADVANCED SMART CLICK
// ============================================================

async function smartClick(
    tabId,
    target
) {

    return await runOnPage(

        tabId,

        async target => {

            const wanted =
                String(
                    target || ""
                )
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, " ");


            if (!wanted) {

                return {

                    success:
                        false,

                    message:
                        "No click target was provided."
                };
            }
            async function waitForSeconds(seconds) {
    const ms = Math.max(1, Number(seconds)) * 1000;

    setStatus(`⏳ Waiting ${seconds} seconds...`);

    await new Promise(resolve => setTimeout(resolve, ms));

    setStatus(`✅ Wait completed (${seconds}s)`);
}


            // =================================================
            // ALIASES
            // =================================================

            const aliases = {

                like: [
                    "like",
                    "like button",
                    "thumbs up",
                    "love",
                    "react",
                    "reaction"
                ],

                unlike: [
                    "unlike",
                    "remove like",
                    "remove the like"
                ],

                follow: [
                    "follow",
                    "follow button",
                    "follow user",
                    "follow account",
                    "follow person"
                ],

                unfollow: [
                    "unfollow",
                    "unfollow button",
                    "stop following",
                    "remove follow"
                ],

                subscribe: [
                    "subscribe",
                    "subscribe button",
                    "join channel"
                ],

                unsubscribe: [
                    "unsubscribe",
                    "unsubscribe button",
                    "cancel subscription"
                ],

                comment: [
                    "comment",
                    "comments",
                    "comment button",
                    "reply",
                    "replies"
                ],

                share: [
                    "share",
                    "share button",
                    "share post",
                    "share video",
                    "share this"
                ],

                save: [
                    "save",
                    "save button",
                    "bookmark",
                    "book mark",
                    "save post",
                    "save video"
                ],

                send: [
                    "send",
                    "send button",
                    "submit"
                ],

                login: [
                    "login",
                    "log in",
                    "sign in",
                    "signin"
                ],

                logout: [
                    "logout",
                    "log out",
                    "sign out",
                    "signout"
                ],

                search: [
                    "search",
                    "search button",
                    "magnifying glass"
                ],

                menu: [
                    "menu",
                    "more",
                    "more options",
                    "options"
                ],

                close: [
                    "close",
                    "cancel",
                    "dismiss",
                    "x button"
                ],

                next: [
                    "next",
                    "next button",
                    "next post",
                    "next video"
                ],

                previous: [
                    "previous",
                    "previous button",
                    "previous post",
                    "previous video"
                ]
            };


           let normalizedTarget = wanted;

// Check negative actions first
if (
    wanted === "unfollow" ||
    wanted.includes("unfollow") ||
    wanted.includes("stop following") ||
    wanted.includes("remove follow")
) {
    normalizedTarget = "unfollow";
}
else if (
    wanted === "unsubscribe" ||
    wanted.includes("unsubscribe") ||
    wanted.includes("cancel subscription")
) {
    normalizedTarget = "unsubscribe";
}
else if (
    wanted === "unlike" ||
    wanted.includes("unlike") ||
    wanted.includes("remove like")
) {
    normalizedTarget = "unlike";
}
else {

    for (const key in aliases) {

        if (
            aliases[key].some(
                alias =>
                    wanted === alias ||
                    wanted.includes(alias)
            )
        ) {

            normalizedTarget = key;

            break;
        }
    }
}


            // =================================================
            // COLLECT CANDIDATES
            // =================================================

            const selectors = [

                "button",
                "a",
                "[role='button']",
                "[role='link']",
                "[role='menuitem']",
                "[role='option']",
                "[role='tab']",
                "input[type='button']",
                "input[type='submit']",
                "[tabindex='0']",
                "[aria-label]",
                "[title]",
                "[data-testid]",
                "[data-tooltip]",
                "[data-tooltip-content]"
            ];


            let elements =
                Array.from(
                    document.querySelectorAll(
                        selectors.join(",")
                    )
                );


            // =================================================
            // OPEN SHADOW ROOTS
            // =================================================

            function collectShadowRoots(root) {

                const result = [];


                const all =
                    root.querySelectorAll
                        ? root.querySelectorAll("*")
                        : [];


                for (
                    const el
                    of all
                ) {

                    if (
                        el.shadowRoot
                    ) {

                        result.push(
                            el.shadowRoot
                        );

                        result.push(
                            ...collectShadowRoots(
                                el.shadowRoot
                            )
                        );
                    }
                }


                return result;
            }


            try {

                const roots =
                    collectShadowRoots(
                        document
                    );


                for (
                    const root
                    of roots
                ) {

                    elements.push(
                        ...Array.from(
                            root.querySelectorAll(
                                selectors.join(",")
                            )
                        )
                    );
                }

            }
            catch (error) {
                console.log(
                    "Shadow DOM scan skipped."
                );
            }


            // Remove duplicates
            elements =
                [...new Set(elements)];


            // =================================================
            // HELPERS
            // =================================================

            function isVisible(el) {

                if (!el) {
                    return false;
                }


                const rect =
                    el.getBoundingClientRect();


                const style =
                    window.getComputedStyle(el);


                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    style.opacity !== "0"
                );
            }


            function isDisabled(el) {

                return (
                    el.disabled === true ||
                    el.getAttribute(
                        "aria-disabled"
                    ) === "true"
                );
            }


            function clean(value) {

                return String(
                    value || ""
                )
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
            }


            function getAttributeText(el) {

                return [

                    el.innerText,

                    el.textContent,

                    el.value,

                    el.getAttribute("aria-label"),

                    el.getAttribute("title"),

                    el.getAttribute("data-testid"),

                    el.getAttribute("data-tooltip"),

                    el.getAttribute("data-tooltip-content"),

                    el.getAttribute("name"),

                    el.getAttribute("alt"),

                    el.getAttribute("data-label"),

                    el.getAttribute("data-action"),

                    el.getAttribute("data-reaction"),

                    el.getAttribute("data-test"),

                    el.getAttribute("data-test-id")

                ]
                    .filter(Boolean)
                    .map(clean)
                    .join(" ");
            }


            function getAria(el) {

                return clean(
                    el.getAttribute(
                        "aria-label"
                    )
                );
            }


            function getTitle(el) {

                return clean(
                    el.getAttribute(
                        "title"
                    )
                );
            }


            function getTestId(el) {

                return clean(
                    el.getAttribute(
                        "data-testid"
                    )
                );
            }


            // =================================================
            // NEGATIVE WORDS
            // =================================================

            function isWrongAction(
                text
            ) {

                if (
                    normalizedTarget === "like"
                ) {

                    return (
                        text.includes("dislike") ||
                        text.includes("remove like") ||
                        text.includes("unlike")
                    );
                }


                if (
                    normalizedTarget === "follow"
                ) {

                    return (
                        text.includes("unfollow") ||
                        text.includes("following")
                    );
                }


                if (
                    normalizedTarget === "subscribe"
                ) {

                    return (
                        text.includes("unsubscribe") ||
                        text.includes("subscribed")
                    );
                }


                if (
                    normalizedTarget === "unfollow"
                ) {

                    return !(
                        text.includes("unfollow") ||
                        text.includes("following")
                    );
                }


                if (
                    normalizedTarget === "unsubscribe"
                ) {

                    return !(
                        text.includes("unsubscribe") ||
                        text.includes("subscribed")
                    );
                }


                if (
                    normalizedTarget === "unlike"
                ) {

                    return !(
                        text.includes("unlike") ||
                        text.includes("remove like")
                    );
                }


                return false;
            }


            // =================================================
            // SCORE ELEMENT
            // =================================================

            function scoreElement(el) {

                if (
                    !isVisible(el) ||
                    isDisabled(el)
                ) {
                    return -1;
                }


                const text =
                    getAttributeText(el);


                if (!text) {
                    return -1;
                }


                if (
                    isWrongAction(text)
                ) {
                    return -1;
                }


                let score =
                    0;


                const aria =
                    getAria(el);


                const title =
                    getTitle(el);


                const testId =
                    getTestId(el);


                // Exact target
                if (
                    text === wanted
                ) {
                    score += 250;
                }


                // Exact normalized action
                if (
                    text === normalizedTarget
                ) {
                    score += 230;
                }


                // aria exact
                if (
                    aria === wanted
                ) {
                    score += 220;
                }


                if (
                    aria === normalizedTarget
                ) {
                    score += 210;
                }


                // title exact
                if (
                    title === wanted
                ) {
                    score += 180;
                }


                if (
                    title === normalizedTarget
                ) {
                    score += 170;
                }


                // test ID
                if (
                    testId.includes(
                        normalizedTarget
                    )
                ) {
                    score += 100;
                }


                // Text contains target
                if (
                    text.includes(wanted)
                ) {
                    score += 120;
                }


                if (
                    text.includes(
                        normalizedTarget
                    )
                ) {
                    score += 110;
                }


                // aria contains
                if (
                    aria.includes(
                        normalizedTarget
                    )
                ) {
                    score += 100;
                }


                // title contains
                if (
                    title.includes(
                        normalizedTarget
                    )
                ) {
                    score += 80;
                }


                // test ID contains
                if (
                    testId.includes(
                        normalizedTarget
                    )
                ) {
                    score += 90;
                }


                // Native clickable elements
                if (
                    el.tagName === "BUTTON"
                ) {
                    score += 35;
                }


                if (
                    el.tagName === "A"
                ) {
                    score += 20;
                }


                if (
                    el.getAttribute("role") === "button"
                ) {
                    score += 35;
                }


                // SVG/icon parent
                if (
                    el.querySelector("svg")
                ) {
                    score += 10;
                }


                // Small visible button often represents action icon
                const rect =
                    el.getBoundingClientRect();


                if (
                    rect.width <= 300 &&
                    rect.height <= 150
                ) {
                    score += 5;
                }


                return score;
            }


            // =================================================
            // FIND BEST ELEMENT
            // =================================================

            let bestElement =
                null;


            let bestScore =
                -1;


            for (
                const element
                of elements
            ) {

                const score =
                    scoreElement(
                        element
                    );


                if (
                    score >
                    bestScore
                ) {

                    bestScore =
                        score;

                    bestElement =
                        element;
                }
            }


            // =================================================
            // SEARCH TEXT ELEMENT PARENTS
            // =================================================

            if (
                !bestElement ||
                bestScore < 50
            ) {

                const textElements =
                    Array.from(
                        document.querySelectorAll(
                            "span, div, p, label"
                        )
                    );


                for (
                    const element
                    of textElements
                ) {

                    if (
                        !isVisible(element)
                    ) {
                        continue;
                    }


                    const text =
                        clean(
                            element.innerText ||
                            element.textContent
                        );


                    if (
                        !text ||
                        !(
                            text === wanted ||
                            text === normalizedTarget
                        )
                    ) {
                        continue;
                    }


                    const parent =
                        element.closest(
                            "button, a, [role='button'], [role='link'], [role='menuitem']"
                        );


                    if (!parent) {
                        continue;
                    }


                    if (
                        isWrongAction(
                            getAttributeText(parent)
                        )
                    ) {
                        continue;
                    }


                    const score =
                        280;


                    if (
                        score >
                        bestScore
                    ) {

                        bestScore =
                            score;

                        bestElement =
                            parent;
                    }
                }
            }


            // =================================================
            // SVG PARENT SEARCH
            // =================================================

            if (
                !bestElement ||
                bestScore < 50
            ) {

                const svgs =
                    Array.from(
                        document.querySelectorAll(
                            "svg"
                        )
                    );


                for (
                    const svg
                    of svgs
                ) {

                    if (
                        !isVisible(svg)
                    ) {
                        continue;
                    }


                    const parent =
                        svg.closest(
                            "button, [role='button'], a, [role='link']"
                        );


                    if (!parent) {
                        continue;
                    }


                    const score =
                        scoreElement(
                            parent
                        );


                    if (
                        score >
                        bestScore
                    ) {

                        bestScore =
                            score;

                        bestElement =
                            parent;
                    }
                }
            }


            // =================================================
            // RETRY FOR DYNAMIC WEBSITES
            // =================================================

            if (
                !bestElement ||
                bestScore < 50
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            900
                        )
                );


                const retryElements =
                    Array.from(
                        document.querySelectorAll(
                            selectors.join(",")
                        )
                    );


                for (
                    const element
                    of retryElements
                ) {

                    const score =
                        scoreElement(
                            element
                        );


                    if (
                        score >
                        bestScore
                    ) {

                        bestScore =
                            score;

                        bestElement =
                            element;
                    }
                }
            }


            // =================================================
            // NO MATCH
            // =================================================

            if (
                !bestElement ||
                bestScore < 50
            ) {

                return {

                    success:
                        false,

                    message:
                        `"${target}" was not found on this page.`
                };
            }


            // =================================================
            // FIND ACTUAL CLICKABLE PARENT
            // =================================================

            let clickable =
                bestElement.closest(
                    "button, a, [role='button'], [role='link'], [role='menuitem']"
                );


            if (!clickable) {
                clickable =
                    bestElement;
            }


            if (
                isDisabled(clickable)
            ) {

                return {

                    success:
                        false,

                    message:
                        `"${target}" is disabled.`
                };
            }


            // =================================================
            // CLICK
            // =================================================

            clickable.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "center",

                inline:
                    "center"
            });


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        600
                    )
            );


            try {

                clickable.focus();

            }
            catch (error) {}


           try {

    clickable.dispatchEvent(
        new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            view: window
        })
    );

    clickable.dispatchEvent(
        new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window
        })
    );

    clickable.dispatchEvent(
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window
        })
    );

}
catch (error) {

    return {
        success: false,
        message: `Could not click "${target}".`
    };

}


            return {

                success:
                    true,

                message:
                    `Clicked ${normalizedTarget}.`
            };

        },

        [target]
    );
}


// ============================================================
// ⌨️ SMART TYPE
// ============================================================

async function smartType(
    tabId,
    text
) {

    return await runOnPage(

        tabId,

        text => {

            let input =
                document.activeElement;


            if (
                !input ||
                !(
                    input.tagName === "INPUT" ||
                    input.tagName === "TEXTAREA" ||
                    input.isContentEditable
                )
            ) {

                input =
                    document.querySelector(
                        [
                            "input:not([type='hidden'])",
                            "textarea",
                            "[contenteditable='true']",
                            "[role='textbox']"
                        ].join(",")
                    );
            }


            if (!input) {

                return {

                    success:
                        false,

                    message:
                        "Input field not found."
                };
            }


            input.focus();


            if (
                input.tagName === "INPUT" ||
                input.tagName === "TEXTAREA"
            ) {

                const prototype =
                    input.tagName === "INPUT"
                        ? HTMLInputElement.prototype
                        : HTMLTextAreaElement.prototype;


                const descriptor =
                    Object.getOwnPropertyDescriptor(
                        prototype,
                        "value"
                    );


                if (
                    descriptor &&
                    descriptor.set
                ) {

                    descriptor.set.call(
                        input,
                        text
                    );

                }
                else {

                    input.value =
                        text;
                }

            }
            else {

                input.textContent =
                    text;
            }


            input.dispatchEvent(
                new InputEvent(
                    "input",
                    {
                        bubbles:
                            true,

                        inputType:
                            "insertText",

                        data:
                            text
                    }
                )
            );


            input.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles:
                            true
                    }
                )
            );


            return {

                success:
                    true
            };

        },

        [text]
    );
}


// ============================================================
// 👁️ VISIBILITY HELPER
// ============================================================

function isElementVisible(el) {

    if (!el) {
        return false;
    }


    const rect =
        el.getBoundingClientRect();


    const style =
        window.getComputedStyle(el);


    return (

        rect.width > 0 &&

        rect.height > 0 &&

        style.display !== "none" &&

        style.visibility !== "hidden" &&

        style.opacity !== "0"
    );
}


// ============================================================
// READY
// ============================================================

console.log(
    "🤖 PRIVI-BROWSER Multi-Site Agent loaded successfully."
);
async function clickInstagramFollow(tabId) {
    const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {

            const elements = [...document.querySelectorAll("*")];

            const followText = elements.find(el => {
                const text = (el.innerText || "").trim();

                return (
                    text === "Follow" &&
                    el.getBoundingClientRect().width > 0 &&
                    el.getBoundingClientRect().height > 0
                );
            });

            if (!followText) {
                return {
                    success: false,
                    message: "Follow button not found"
                };
            }

            const button =
                followText.closest("button") ||
                followText.closest('[role="button"]') ||
                followText.parentElement;

            if (!button) {
                return {
                    success: false,
                    message: "Clickable Follow button not found"
                };
            }

            button.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            button.focus();

            button.dispatchEvent(
                new MouseEvent("mousedown", {
                    bubbles: true,
                    cancelable: true,
                    view: window
                })
            );

            button.dispatchEvent(
                new MouseEvent("mouseup", {
                    bubbles: true,
                    cancelable: true,
                    view: window
                })
            );

            button.click();

            return {
                success: true,
                message: "Follow button clicked"
            };
        }
    });

    return result[0].result;
}