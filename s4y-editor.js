/*
*/

// missing forEach on NodeList for IE11
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Export module to global
var s4yEditor = (function () {
    'use strict';

    var editorElement;
    var caretPositionElement;

    // ======================== Private members =================================
    // Tydy the html text
    function tidy(htmlText) {
        var body = document.createElement('body');
        body.innerHTML = htmlText;
        body.querySelectorAll('p').forEach(function (p) {
            if (!p.innerHTML) {
                p.parentElement.removeChild(p);
            }
        })
        return body.innerHTML;
    }

    // De-minify html text
    function formatText(htmlText) {

        var div = document.createElement('div');
        div.innerHTML = htmlText.trim();

        return formatNode(div, 0).innerHTML;
    }

    // De-minify html node
    function formatNode(node, level) {

        var indentBefore = new Array(level++ + 1).join('  '),
            indentAfter = new Array(level - 1).join('  '),
            textNode;

        for (var i = 0; i < node.children.length; i++) {

            textNode = document.createTextNode('\n' + indentBefore);
            node.insertBefore(textNode, node.children[i]);

            formatNode(node.children[i], level);

            if (node.lastElementChild == node.children[i]) {
                textNode = document.createTextNode('\n' + indentAfter);
                node.appendChild(textNode);
            }
        }

        return node;
    }

    // Show current caret position
    function showCaretPosition() {
        if (document.compForm.switchMode.checked === true) {
            return;
        }
        var ie = (typeof document.selection != "undefined" && document.selection.type != "Control") && true;
        var w3 = (typeof window.getSelection != "undefined") && true;
        var caretOffset = 0;
        var length = 0;
        if (w3) {
            var sel = window.getSelection && window.getSelection();
            if (!sel || sel.rangeCount <= 0) return;
            var range = sel.getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(editorElement);
            length = preCaretRange.toString().trim().length;
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().trim().length;
        } else if (ie) {
            var textRange = document.selection.createRange();
            var preCaretTextRange = document.body.createTextRange();
            preCaretTextRange.moveToElementText(editorElement);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
        caretPositionElement.innerText = caretOffset + "/" + length;
        console.log(caretOffset + "/" + length);
        return caretOffset + "/" + length;
    }

    // ======================== Exported members ================================
    function initEditor(editorId, caretPositionId) {
        caretPositionElement = document.getElementById(caretPositionId);
        editorElement = document.getElementById(editorId);
        editorElement.addEventListener('keydown', showCaretPosition);
        editorElement.addEventListener('keyup', showCaretPosition);
        editorElement.addEventListener('mousedown', showCaretPosition);
        editorElement.addEventListener('mouseup', showCaretPosition);

        document.execCommand("defaultParagraphSeparator", false, "p");
        if (document.compForm.switchMode.checked) { setMode(true); }
    }

    function executeCommand(cmd, value) {
        if (validateMode()) { 
            var result = document.execCommand(cmd, false, value); 
            editorElement.focus();
            return result;
        }
    }

    // Check the editor in editor or raw mode
    function validateMode() {
        if (!document.compForm.switchMode.checked) { return true; }
        alert("Uncheck \"Show HTML\".");
        editorElement.focus();
        return false;
    }

    // Set editor/raw mode
    function setMode(isRawMode) {
        var content;
        if (isRawMode) {
            var rawText = formatText(tidy(editorElement.innerHTML.replace(/\n|\t/g, '').trim()));
            content = document.createTextNode(rawText.trim());
            editorElement.innerHTML = "";
            var rawWrapper = document.createElement("pre");
            editorElement.contentEditable = false;
            rawWrapper.id = "sourceText";
            rawWrapper.contentEditable = true;
            rawWrapper.appendChild(content);
            editorElement.appendChild(rawWrapper);
        } else {
            content = document.createRange();
            content.selectNodeContents(document.getElementById('sourceText'));
            editorElement.innerHTML = content.toString();
            // Re make doc element be contentEditable
            editorElement.contentEditable = true;
        }
        editorElement.focus();
    }

    function clean() {
        if (validateMode() && confirm('Are you sure?')) {
            editorElement.innerHTML = '';
        };
    }

    function getInnerHtml() {
        if (validateMode()) {
            return editorElement.innerHTML;
        }
    }

    return {
        initEditor: initEditor,
        executeCommand: executeCommand,
        validateMode: validateMode,
        setMode: setMode,
        clean: clean,
        getInnerHtml: getInnerHtml
    };
})();

