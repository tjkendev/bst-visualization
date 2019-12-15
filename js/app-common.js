"use strict";

const anime = window.anime;
const $ = window.$;

function createNode(val, id) {
  const new_g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
  new_g.setAttribute("class", `node${id} node`);
  new_g.setAttribute("style", "transform: translateX(15px) translateY(15px)");
  new_g.setAttribute("value", val);
  new_g.setAttribute("nid", id);
  new_g.setAttribute("opacity", 1.0);

  const new_circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
  new_circle.setAttribute("class", "normal-node");
  new_circle.setAttribute("cx", 10);
  new_circle.setAttribute("cy", 10);
  new_circle.setAttribute("r", 20);

  const new_text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
  new_text.setAttribute("class", "node-text");
  new_text.setAttribute("x", -5);
  new_text.setAttribute("y", 17);
  new_text.innerHTML = val;

  new_g.appendChild(new_circle);
  new_g.appendChild(new_text);
  return new_g;
}

function createEdge(val, id) {
  const new_el = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  new_el.setAttribute("class", `edge${id} edge`);
  new_el.setAttribute("d", `M25,25L25,25L25,25`);
  new_el.setAttribute("value", val);
  new_el.setAttribute("nid", id);
  new_el.setAttribute("opacity", 1.0);
  return new_el;
}

function removeNode(id) {
  const es = document.getElementsByClassName(`node${id}`);
  for(let e of es) {
    e.remove();
  }
}

function removeEdge(id) {
  const es = document.getElementsByClassName(`edge${id}`);
  for(let e of es) {
    e.remove();
  }
}

function traverse(root) {
  let cursor = 0, max_depth = 0;
  const result = {};
  const tree_dfs = (node, depth) => {
    if(node.left !== null) {
      tree_dfs(node.left, depth+1);
    }

    result[node.id] = [cursor++, depth];
    max_depth = Math.max(max_depth, depth);

    if(node.right !== null) {
      tree_dfs(node.right, depth+1);
    }
  };
  if(root !== null) tree_dfs(root, 0);
  return [result, max_depth];
}
