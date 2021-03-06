"use strict";

const TurndownService = require('turndown');
const mimeTypes = require('mime-types');
const html = require('html');
const utils = require('../utils');

async function exportSingleNote(branch, format, res) {
    const note = await branch.getNote();

    if (note.type === 'image' || note.type === 'file') {
        return [400, `Note type ${note.type} cannot be exported as single file.`];
    }

    if (format !== 'html' && format !== 'markdown') {
        return [400, 'Unrecognized format ' + format];
    }

    let payload, extension, mime;

    if (note.type === 'text') {
        if (format === 'html') {
            if (!note.content.toLowerCase().includes("<html")) {
                note.content = '<html><head><meta charset="utf-8"></head><body>' + note.content + '</body></html>';
            }

            payload = html.prettyPrint(note.content, {indent_size: 2});
            extension = 'html';
            mime = 'text/html';
        }
        else if (format === 'markdown') {
            const turndownService = new TurndownService();
            payload = turndownService.turndown(note.content);
            extension = 'md';
            mime = 'text/markdown'
        }
    }
    else if (note.type === 'code') {
        payload = note.content;
        extension = mimeTypes.extension(note.mime) || 'code';
        mime = note.mime;
    }
    else if (note.type === 'relation-map' || note.type === 'search') {
        payload = note.content;
        extension = 'json';
        mime = 'application/json';
    }

    const filename = note.title + "." + extension;

    res.setHeader('Content-Disposition', utils.getContentDisposition(filename));
    res.setHeader('Content-Type', mime + '; charset=UTF-8');

    res.send(payload);
}

module.exports = {
    exportSingleNote
};