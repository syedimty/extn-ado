function getWebviewContent(currentText, itemType = 'Epic') {
    return `<!DOCTYPE html>
    <html>
    <head>
        <title>Edit ${itemType}</title>
        <style>/* CSS styles */</style>
    </head>
    <body>
        <h2>Edit ${itemType}</h2>
        <input type="text" value="${currentText}" />
        <button>Save</button>
    </body>
    </html>`;
}

module.exports = getWebviewContent;
