/*
    16/08/2020 Dang Nguyen

*/

// missing forEach on NodeList for IE11
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Export module to global
var s4yEditor = (function () {
    // Editor class definition
    var editor = function (i18nMessages) {
        'use strict';

        var el = redom.el;
        var editorElement;
        var caretPositionElement;
        var switchModeElement;

        var boldBtn, italicBtn, underlineBtn;

        var formatBold = false;
        var formatItalic = false;
        var formatUnderline = false;
        var i18n = getI18nFromMessages(i18nMessages);
        // ======================== Private members =================================
        function getI18nFromMessages(messages) {
            if (!messages) {
                return {
                    buttons: {
                        clear: 'Clear',
                        h1: 'Heading 1',
                        h2: 'Heading 2',
                        paragraph: 'Paragraph',
                        bold: 'Bold',
                        italic: 'Italic',
                        underline: 'Underline',
                        ol: 'Order list',
                        ul: 'Unorder list'
                    },
                    modeSwitcher: 'Switch to HTML view',
                    caretPosition: 'Caret position'
                };
            }
            return {
                buttons: {
                    clear: messages['s4y-editor.tool-bar.clear'],
                    h1: messages['s4y-editor.tool-bar.heading1'],
                    h2: messages['s4y-editor.tool-bar.heading2'],
                    paragraph: messages['s4y-editor.tool-bar.paragraph'],
                    bold: messages['s4y-editor.tool-bar.bold'],
                    italic: messages['s4y-editor.tool-bar.italic'],
                    underline: messages['s4y-editor.tool-bar.underline'],
                    ol: messages['s4y-editor.tool-bar.ol'],
                    ul: messages['s4y-editor.tool-bar.ul']
                },
                modeSwitcher: messages['s4y-editor.tool-bar.mode-switcher'],
                caretPosition: messages['s4y-editor.tool-bar.caret-position']
            };
        }
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

        // Show current caret position + Update bold, italic, underline buttons active status
        function showCaretPosition() {
            if (switchModeElement.checked === true) {
                return;
            }

            formatBold = document.queryCommandState('bold');
            formatItalic = document.queryCommandState('italic');
            formatUnderline = document.queryCommandState('underline');
            if (formatBold === true) {
                boldBtn.classList.add('active');
            } else {
                boldBtn.classList.remove('active');
            }
            if (formatItalic === true) {
                italicBtn.classList.add('active');
            } else {
                italicBtn.classList.remove('active');
            }
            if (formatUnderline === true) {
                underlineBtn.classList.add('active');
            } else {
                underlineBtn.classList.remove('active');
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

        // clearFormatRecurse will not remove format on the element itself. Only process on the children of the element
        // Using Tree Post Order Traversal to browse the DOM tree and process all nodes
        // Paramenters:
        //  + element: parent element that contain children need to remove format
        function clearFormatRecurse(element, isRoot) {
            var allowTags = ['P', 'B', 'I', 'A', 'UL', 'OL', 'LI', 'H1', 'H2'];
            var allowAttributes = ['href'];

            if (!element) {
                return;
            }
            var children = element.children;
            for (var index = 0; index < children.length; index++) {
                var child = children[index];
                clearFormatRecurse(child, false);
            }

            if (!isRoot) {
                // Process node
                var tagName = element.nodeName;
                if (isAllowedTag(tagName)) {
                    // Tag allowed then need to check and remove attributes if need
                    var attributes = element.attributes;
                    for (var j = 0; j < attributes.length; j++) {
                        var attribute = attributes[j];
                        if (!isAllowAttribute(attribute.name)) {
                            // Remove the not allowed attribute
                            element.removeAttribute(attribute.name);
                        }
                    }
                } else {
                    // Remove tag but keep innerHtml (unwrap), append the innerHtml into the parent element
                    if (element.innerHTML.trim().length === 0) {
                        // Remove the node
                        element.parentElement.removeChild(element);
                    } else {
                        element.outerHTML = element.innerHTML.trim();
                    }
                }
            }

            function isAllowedTag(tagName) {
                return allowTags.some(function (value, index) {
                    return tagName === value;
                });
            }

            function isAllowAttribute(attributeName) {
                return allowAttributes.some(function (value, index) {
                    return value === attributeName;
                });
            }
        }

        // ======================== Exported members ================================
        function initEditor(editorContainerId) {
            var editorContainer = document.getElementById(editorContainerId);
            // Create toolbar div
            var toolBarDiv = el('div', { class: 's4y-editor-toolbar' });

            // cleanBtn: <button type="button" onclick="s4yEditor.clean()"><i class="fa fa-eraser"></i></button>
            var cleanBtn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.clear
            }, [
                el('i', { class: 'fa fa-trash' })
            ]);
            cleanBtn.addEventListener('click', function () {
                clean();
            });
            // h1: <button type="button" id="h1"><strong>H1</strong></button>
            var h1Btn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.h1
            }, [el('strong', 'H1')]);
            h1Btn.addEventListener('click', function () {
                var result = executeCommand('formatblock', 'h1');
                if (!result) {
                    result = executeCommand('formatblock', '<H1>');
                }
            });
            // h2: <button type="button" id="h2"><strong>H2</strong></button>
            var h2Btn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.h2
            }, [el('strong', 'H2')]);
            h2Btn.addEventListener('click', function () {
                var result = executeCommand('formatblock', 'h2');
                if (!result) {
                    result = executeCommand('formatblock', '<H2>');
                }
            });
            // p: <button type="button" id="p"><i class="fa fa-paragraph"></i></button>
            var pBtn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.paragraph
            }, [el('i', { class: 'fa fa-paragraph' })]);
            pBtn.addEventListener('click', function () {
                var result = executeCommand('formatblock', 'p');
                if (!result) {
                    result = executeCommand('formatblock', '<P>');
                }
            });
            // bold: <button type="button" onclick="s4yEditor.executeCommand('bold');"><i class="fa fa-bold"></i></button>
            boldBtn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.bold
            }, [el('i', { class: 'fa fa-bold' })]);
            boldBtn.addEventListener('click', function () {
                executeCommand('bold');
            });
            // italic: <button type="button" onclick="s4yEditor.executeCommand('italic');"><i class="fa fa-italic"></i></button>
            italicBtn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.italic
            }, [el('i', { class: 'fa fa-italic' })]);
            italicBtn.addEventListener('click', function () {
                executeCommand('italic');
            });
            // underline: <button type="button" onclick="s4yEditor.executeCommand('underline');"><i class="fa fa-underline"></i></button>
            underlineBtn = el('button', {
                type: 'button',
                class: 'btn btn-default', title: i18n.buttons.underline
            }, [el('i', { class: 'fa fa-underline' })]);
            underlineBtn.addEventListener('click', function () {
                executeCommand('underline');
            });
            // ol: <button type="button" id="ol"><i class="fa fa-list-ol"></i></button>
            var olBtn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.ol
            }, [el('i', { class: 'fa fa-list-ol' })]);
            olBtn.addEventListener('click', function () {
                var result = executeCommand('insertOrderedList');
                if (!result) {
                    result = executeCommand('InsertOrderedList');
                }
            });
            // ul: <button type="button" id="ul"><i class="fa fa-list"></i></button>
            var ulBtn = el('button', {
                type: 'button',
                class: 'btn btn-default',
                title: i18n.buttons.ul
            }, [el('i', { class: 'fa fa-list' })]);
            ulBtn.addEventListener('click', function () {
                var result = executeCommand('insertUnorderedList');
                if (!result) {
                    result = executeCommand('InsertUnorderedList');
                }
            });

            /* Mode:
            <div class="s4y-editor-mode">
                    <label><input type="checkbox" /> Show HTML</label>
                </div>
            */
            var editModeDiv = el('div', { class: 's4y-editor-mode' }, [
                el('label', { title: i18n.modeSwitcher }, [
                    el('input', { type: 'checkbox' }),
                    ' Show HTML'
                ])
            ]);
            // caret position: <small><i>Position: <span>0/0</span></i></small>
            var caretSmall = el('small', { title: i18n.caretPosition }, el('i', 'Position: ', el('span', '0/0')));

            // Clear formatting
            var clearFormatBtn = el('button', { title: 'Clear format', class: 'btn btn-default pull-right' }, el('i', { class: 'fa fa-asterisk' }), ' Clear format');
            clearFormatBtn.addEventListener('click', function () {
                if (validateMode()) {
                    // Get a clone from element
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = editorElement.outerHTML;
                    var cloneElement = tempDiv.firstChild;
                    clearFormatRecurse(cloneElement, true);
                    editorElement.innerHTML = cloneElement.innerHTML;
                }
            });

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
            toolBarDiv.appendChild(clearFormatBtn);
            // Completed construct toolbar div

            // Construct contenteditable div: <div class="s4y-editor-textbox" contenteditable="true"></div>
            editorElement = el('div', { class: 's4y-editor-textbox', contenteditable: 'true' });

            editorContainer.appendChild(toolBarDiv);
            editorContainer.appendChild(editorElement);

            caretPositionElement = caretSmall.children[0].children[0]; // Get <span>0/0</span>
            switchModeElement = editModeDiv.children[0];
            switchModeElement.addEventListener('change', function (e) {
                setMode(e.target.checked);
            });

            editorElement.addEventListener('keydown', showCaretPosition);
            editorElement.addEventListener('keyup', showCaretPosition);
            editorElement.addEventListener('mousedown', showCaretPosition);
            editorElement.addEventListener('mouseup', showCaretPosition);

            document.execCommand("defaultParagraphSeparator", false, "p");
            if (switchModeElement.checked) {
                setMode(true);
            }
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
            if (!switchModeElement.checked) {
                return true;
            }
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
                rawWrapper.className = "s4y-editor-raw";
                rawWrapper.contentEditable = true;
                rawWrapper.appendChild(content);
                editorElement.appendChild(rawWrapper);
            } else {
                content = document.createRange();
                content.selectNodeContents(editorElement.children[0]);
                editorElement.innerHTML = content.toString();
                // Re make doc element be contentEditable
                editorElement.contentEditable = true;
            }
            editorElement.focus();
        }

        function clean() {
            if (validateMode() && confirm('Are you sure?')) {
                editorElement.innerHTML = '';
            }
        }

        function getInnerHtml() {
            if (validateMode()) {
                return editorElement.innerHTML;
            }
        }

        function setInnerHtml(innerHtml) {
            if (validateMode()) {
                editorElement.innerHTML = innerHtml;
            }
        }

        return {
            initEditor: initEditor,
            validateMode: validateMode,
            getInnerHtml: getInnerHtml,
            setInnerHtml: setInnerHtml,
        };
    };
    return {
        Editor: editor
    };
})();