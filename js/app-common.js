"use strict";

const anime = window.anime;

function createNode(val, id) {
  const new_g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
  new_g.setAttribute("class", `node${id} node`);
  new_g.setAttribute("style", "transform: translateX(15px) translateY(15px)");
  new_g.setAttribute("value", val);
  new_g.setAttribute("nid", id);
  new_g.setAttribute("opacity", 1.0);

  const new_circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
  new_circle.setAttribute("class", "normal-node node-circle");
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
  return {
    ps: result,
    depth: max_depth,
  };
}

function begin_change_color(target_node, update_nodes) {
  if(target_node !== null) {
    const clist = target_node.querySelector("circle").classList;
    clist.remove("normal-node");
    clist.add("target-node");
  }
  for(let node of update_nodes) {
    if(target_node === node) continue;

    const clist = node.querySelector("circle").classList;
    clist.remove("normal-node");
    clist.add("update-node");
  }
}

function end_change_color(target_node, update_nodes) {
  if(target_node !== null) {
    const clist = target_node.querySelector("circle").classList;
    clist.remove("target-node");
    clist.add("normal-node");
  }
  for(let node of update_nodes) {
    if(target_node === node) continue;

    const clist = node.querySelector("circle").classList;
    clist.remove("update-node");
    clist.add("normal-node");
  }
}

// get a random integer within [0, x)
function randint(x) {
  return Math.floor(Math.random() * x);
}

function set_add_random(add_tree_node) {
  document.querySelector(".add-random").onclick = ((el) => {
    const v = randint(1000);
    add_tree_node(v);
  });
}

function set_remove_random(remove_tree_node, node_view) {
  document.querySelector(".remove-random").onclick = ((el) => {
    const vs = Object.keys(node_view);
    if(vs.length > 0) {
      const v = parseInt(vs[randint(vs.length)]);
      if(!isNaN(v) && 0 <= v && v <= 999) {
        remove_tree_node(v);
      }
    }
  });
}

function set_add_value(add_tree_node) {
  document.querySelector(".add").onclick = ((el) => {
    const val = document.querySelector(".node-key").value;
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      add_tree_node(v);
    }
  });
}

function set_remove_value(remove_tree_node) {
  document.querySelector(".remove").onclick = ((el) => {
    const val = document.querySelector(".node-key").value;
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      remove_tree_node(v);
    }
  });
}

const EDGE_B = 10;
const NODE_W = 20, NODE_H = 40;
const BASE_X = 55, BASE_Y = 30;

function get_node_px(p) {
  return p[0] * NODE_W + BASE_X;
}

function get_node_py(p) {
  return p[1] * NODE_H + BASE_Y;
}

function get_edge_pos(p) {
  const [rx, ry] = p;
  return [rx * NODE_W + EDGE_B + BASE_X, ry * NODE_H + EDGE_B + BASE_Y];
}

