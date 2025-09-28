// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  //插入节点
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  //移除元素
  remove(el) {
    const parentNode = el.parentNode;
    if (parentNode) {
      parentNode.removeChild(el);
    }
  },
  //设置元素的text
  setElementText(el, text) {
    el.textContent = text;
  },
  //创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
  //设置nodeValue
  setText(node, text) {
    return node.nodeValue = text;
  },
  //获取父节点
  parentNode(el) {
    return el.parentNode;
  },
  //获取下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling;
  },
  //获取元素
  querySelector(selector) {
    return document.querySelector(selector);
  }
};
export {
  nodeOps
};
//# sourceMappingURL=vue.esm.js.map
