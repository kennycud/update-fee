export function utf8ToBase64(inputString) {
    // Encode the string as UTF-8
    const utf8String = encodeURIComponent(inputString).replace(
        /%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(Number("0x" + p1))
    );

    // Convert the UTF-8 encoded string to base64
    return btoa(utf8String);
}