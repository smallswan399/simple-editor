function tidy(htmlText) {
    const body = document.createElement('body');
    body.innerHTML = htmlText;
    body.querySelectorAll('p').forEach(function (p) {
        if (!p.innerHTML) {
            p.parentElement.removeChild(p);
        }
    })
    return body.innerHTML;
}


function formatText(htmlText) {

    var div = document.createElement('div');
    div.innerHTML = htmlText.trim();

    return formatNode(div, 0).innerHTML;
}

function formatNode(node, level) {

    var indentBefore = new Array(level++ + 1).join('  '),
        indentAfter  = new Array(level - 1).join('  '),
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