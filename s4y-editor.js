/*
    16/08/2020 Dang Nguyen

*/

// missing forEach on NodeList for IE11
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Export module to global
var s4yEditor = (function () {
    'use strict';

    var el = redom.el;
    var mount = redom.mount;
    var editorElement;
    var caretPositionElement;
    var switchModeElement;

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
        if (switchModeElement.checked === true) {
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
    function initEditor(editorContainerId) {
        var editorContainer = document.getElementById(editorContainerId);
        // Create toolbar div
        var toolBarDiv = el('div', {class: 'sy4-editor-toolbar'});

        // cleanBtn: <button type="button" onclick="s4yEditor.clean()"><i class="fa fa-eraser"></i></button>
        var cleanBtn = el('button', { type: 'button' }, [
            el('i', { class: 'fa fa-eraser' })
        ]);
        cleanBtn.addEventListener('click', s4yEditor.clean);
        // h1: <button type="button" id="h1"><strong>H1</strong></button>
        var h1Btn = el('button', { type: 'button' }, [el('strong', 'H1')]);
        h1Btn.addEventListener('click', function () {
            var result = executeCommand('formatblock', 'h1');
            if (!result) {
                result = executeCommand('formatblock', '<H1>');
            }
        });
        // h2: <button type="button" id="h2"><strong>H2</strong></button>
        var h2Btn = el('button', { type: 'button' }, [el('strong', 'H2')]);
        h2Btn.addEventListener('click', function () {
            var result = executeCommand('formatblock', 'h2');
            if (!result) {
                result = executeCommand('formatblock', '<H2>');
            }
        });
        // p: <button type="button" id="p"><i class="fa fa-paragraph"></i></button>
        var pBtn = el('button', { type: 'button' }, [el('i', { class: 'fa fa-paragraph' })]);
        pBtn.addEventListener('click', function () {
            var result = executeCommand('formatblock', 'p');
            if (!result) {
                result = executeCommand('formatblock', '<P>');
            }
        });
        // bold: <button type="button" onclick="s4yEditor.executeCommand('bold');"><i class="fa fa-bold"></i></button>
        var boldBtn = el('button', { type: 'button' }, [el('i', { class: 'fa fa-bold' })]);
        boldBtn.addEventListener('click', function () {
            executeCommand('bold');
        });
        // italic: <button type="button" onclick="s4yEditor.executeCommand('italic');"><i class="fa fa-italic"></i></button>
        var italicBtn = el('button', { type: 'button' }, [el('i', { class: 'fa fa-italic' })]);
        italicBtn.addEventListener('click', function () {
            executeCommand('italic');
        });
        // underline: <button type="button" onclick="s4yEditor.executeCommand('underline');"><i class="fa fa-underline"></i></button>
        var underlineBtn = el('button', { type: 'button' }, [el('i', { class: 'fa fa-underline' })]);
        underlineBtn.addEventListener('click', function () {
            executeCommand('underline');
        });
        // ol: <button type="button" id="ol"><i class="fa fa-list-ol"></i></button>
        var olBtn = el('button', { type: 'button' }, [el('i', { class: 'fa fa-list-ol' })]);
        olBtn.addEventListener('click', function () {
            var result = executeCommand('insertOrderedList');
            if (!result) {
                result = executeCommand('InsertOrderedList');
            }
        });
        // ul: <button type="button" id="ul"><i class="fa fa-list"></i></button>
        var ulBtn = el('button', { type: 'button' }, [el('i', { class: 'fa fa-list' })]);
        ulBtn.addEventListener('click', function () {
            var result = executeCommand('insertUnorderedList');
            if (!result) {
                result = executeCommand('InsertUnorderedList');
            }
        });

        /* Mode:
        <div id="editMode">
                    <input type="checkbox" name="switchMode" id="switchBox"
                        onchange="s4yEditor.setMode(this.checked);" />
                    <label for="switchBox">Show HTML</label>
                </div>
        */
        var editModeDiv = el('div', { id: 'editMode' }, [
            el('input', { type: 'checkbox', name: 'switchMode', id: 'switchBox' }),
            el('label', { for: 'switchBox' }, 'Show HTML')
        ]);
        // caret position: <small><i>Position: <span id="caret">0/0</span></i></small>
        var caretSmall = el('small', el('i', 'Position: ', el('span', { id: 'caret' }, '0/0')));
        // append buttons to toolbar
        toolBarDiv.appendChild(cleanBtn);
        toolBarDiv.appendChild(h1Btn);
        toolBarDiv.appendChild(h2Btn);
        toolBarDiv.appendChild(pBtn);
        toolBarDiv.appendChild(boldBtn);
        toolBarDiv.appendChild(italicBtn);
        toolBarDiv.appendChild(underlineBtn);
        toolBarDiv.appendChild(olBtn);
        toolBarDiv.appendChild(ulBtn);
        toolBarDiv.appendChild(editModeDiv);
        toolBarDiv.appendChild(caretSmall);
        // Complete construct toolbar div

        // Construct contenteditable div: <div id="textBox" class="text-box" contenteditable="true"></div>
        var textBoxDiv = el('div', {id: 'textBox', class: 'text-box', contenteditable: 'true'});

        editorContainer.appendChild(toolBarDiv);
        editorContainer.appendChild(textBoxDiv);

        caretPositionElement = caretSmall.children[0].children[0]; // Get <span id="caret">0/0</span>
        switchModeElement = editModeDiv.children[0];
        switchModeElement.addEventListener('change', function (e) {
            setMode(e.target.checked);
        });

        editorElement = textBoxDiv;
        editorElement.addEventListener('keydown', showCaretPosition);
        editorElement.addEventListener('keyup', showCaretPosition);
        editorElement.addEventListener('mousedown', showCaretPosition);
        editorElement.addEventListener('mouseup', showCaretPosition);

        document.execCommand("defaultParagraphSeparator", false, "p");
        if (switchModeElement.checked) { setMode(true); }
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
        if (!switchModeElement.checked) { return true; }
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

