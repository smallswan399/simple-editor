var tree = {
    "name": "root",
    "children": [
        {
            "name": "first child",
            "children": [
                {
                    "name": "first child of first",
                    "children": []
                },
                {
                    "name": "second child of first",
                    "children": []
                }
            ]
        },
        {
            "name": "second child",
            "children": []
        }
    ]
}

function postOrder(root) {
    if (root == null) return;

    root.children.forEach(postOrder);

    console.log(root.name);
}

postOrder(tree);