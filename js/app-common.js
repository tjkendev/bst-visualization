"use strict";

const EDGE_B = 10;
const NODE_W = 20, NODE_H = 40;
const BASE_X = 55, BASE_Y = 30;
const FIRST_X = 10, FIRST_Y = 10;
const C_SIZE = 20;

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

function create_node(val, id) {
  const new_g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
  new_g.setAttribute("class", `node${id} node`);
  new_g.setAttribute("style", "transform: translateX(15px) translateY(15px)");
  new_g.setAttribute("value", val);
  new_g.setAttribute("nid", id);
  new_g.setAttribute("opacity", 1.0);

  // add an onclick event listener
  new_g.onclick = ((el) => {
    const input = document.querySelector(".node-key");
    if(input) input.value = val;
  });

  const new_circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
  new_circle.setAttribute("class", "normal-node node-circle");
  new_circle.setAttribute("cx", FIRST_X);
  new_circle.setAttribute("cy", FIRST_Y);
  new_circle.setAttribute("r", C_SIZE);

  const new_text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
  new_text.setAttribute("class", "node-text");
  new_text.setAttribute("x", -5);
  new_text.setAttribute("y", 17);
  new_text.innerHTML = val;

  new_g.appendChild(new_circle);
  new_g.appendChild(new_text);
  return new_g;
}

function create_edge(val, id) {
  const x = FIRST_X + EDGE_B, y = FIRST_Y + EDGE_B;
  const new_el = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  new_el.setAttribute("class", `edge${id} edge`);
  new_el.setAttribute("d", `M${x},${y}L${x},${y}L${x},${y}`);
  new_el.setAttribute("value", val);
  new_el.setAttribute("nid", id);
  new_el.setAttribute("opacity", 1.0);
  return new_el;
}

function remove_node(id) {
  const es = document.getElementsByClassName(`node${id}`);
  for(let e of es) {
    e.remove();
  }
}

function remove_edge(id) {
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

function begin_change_current_color(target_node, current_nodes) {
  for(const node of current_nodes) {
    const clist = node.querySelector("circle").classList;
    if(node === target_node) {
      clist.remove("target-node");
      clist.add("current-target-node");
    } else {
      clist.remove("update-node");
      clist.add("current-node");
    }
  }
}

function end_change_current_color(target_node, current_nodes) {
  for(const node of current_nodes) {
    const clist = node.querySelector("circle").classList;
    if(node === target_node) {
      clist.remove("current-target-node");
      clist.add("target-node");
    } else {
      clist.remove("current-node");
      clist.add("update-node");
    }
  }
}

function default_translate_obj(node_map, ps, tl) {
  tl.add({
    targets: ['g.node'],
    translateX: (el) => {
      const n_id = el.getAttribute("nid");
      return get_node_px(ps[n_id]);
    },
    translateY: (el) => {
      const n_id = el.getAttribute("nid");
      return get_node_py(ps[n_id]);
    },
    duration: 1000,
    easing: 'linear',
  }).add({
    targets: ['path.edge'],
    d: [{value: (el) => {
      const n_id = el.getAttribute("nid");
      const node = node_map[n_id];
      const [fx, fy] = get_edge_pos(ps[n_id]);

      const l_child = node.left, r_child = node.right;
      let l_tx = fx, l_ty = fy;
      if(l_child !== null) {
        [l_tx, l_ty] = get_edge_pos(ps[l_child.id]);
      }
      let r_tx = fx, r_ty = fy;
      if(r_child !== null) {
        [r_tx, r_ty] = get_edge_pos(ps[r_child.id]);
      }
      return `M${l_tx},${l_ty}L${fx},${fy}L${r_tx},${r_ty}`;
    }}],
    duration: 1000,
    easing: 'linear',
  }, '-=1000');
}

function hide_nodes(tl, target_nodes, target_edges) {
  tl.add({
    targets: target_edges,
    opacity: 0,
    duration: 500,
    easing: 'linear',
    update: update_hidden_node(),
  }).add({
    targets: target_nodes,
    opacity: 0,
    duration: 500,
    easing: 'linear',
    update: update_hidden_node(),
  });
}

function update_hidden_node() {
  let deleted = false;
  return (anim) => {
    if(anim.progress < 100) {
      if(deleted) {
        anim.animatables.forEach((e) => {
          const el = e.target;
          el.style["display"] = "";
        });
        deleted = false;
      }
    } else {
      if(!deleted) {
        anim.animatables.forEach((e) => {
          const el = e.target;
          el.style["display"] = "none";
        });
        deleted = true;
      }
    }
  };
}

const NODE_MAX_KEY = 999;

// get a random integer within [0, x)
function randint(x) {
  return Math.floor(Math.random() * x);
}

function set_add_random(add_tree_node) {
  const input = document.querySelector(".node-key");
  document.querySelector(".add-random").onclick = ((el) => {
    const v = randint(NODE_MAX_KEY + 1);
    add_tree_node(v);
    input.value = v;
  });
}

function set_remove_random(remove_tree_node, node_view) {
  const input = document.querySelector(".node-key");
  document.querySelector(".remove-random").onclick = ((el) => {
    const vs = Object.keys(node_view);
    if(vs.length > 0) {
      const v = parseInt(vs[randint(vs.length)]);
      if(!isNaN(v) && 0 <= v && v <= NODE_MAX_KEY) {
        remove_tree_node(v);
        input.value = v;
      }
    }
  });
}

function set_add_value(add_tree_node) {
  const input = document.querySelector(".node-key");
  document.querySelector(".add").onclick = ((el) => {
    const val = input.value;
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= NODE_MAX_KEY) {
      add_tree_node(v);
    }
  });
}

function set_remove_value(remove_tree_node) {
  document.querySelector(".remove").onclick = ((el) => {
    const val = document.querySelector(".node-key").value;
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= NODE_MAX_KEY) {
      remove_tree_node(v);
    }
  });
}

function set_add_inc(add_tree_node) {
  const input = document.querySelector(".node-key");
  document.querySelector(".add-inc").onclick = ((el) => {
    const val = input.value;
    const v = parseInt(val, 10) + 1;
    if(!isNaN(v) && 0 <= v && v <= NODE_MAX_KEY) {
      add_tree_node(v);
      input.value = v;
    }
  });
}

function set_add_dec(add_tree_node, node_view) {
  const input = document.querySelector(".node-key");
  document.querySelector(".add-dec").onclick = ((el) => {
    const val = input.value;
    const v = parseInt(val, 10) - 1;
    if(!isNaN(v) && 0 <= v && v <= NODE_MAX_KEY) {
      add_tree_node(v);
      input.value = v;
    }
  });
}

class BaseNode {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.id = ++BaseNode.node_id_gen;
  }

  remove_child(node) {
    if(this.left === node) {
      this.remove_left();
    }
    if(this.right === node) {
      this.remove_right();
    }
  }

  remove_left() {
    const left = this.left;
    if(left !== null) {
      this.left = left.prt = null;
    }
    return left;
  }
  remove_right() {
    const right = this.right;
    if(right !== null) {
      this.right = right.prt = null;
    }
    return right;
  }

  set_left(node) {
    if(this.left !== null) {
      this.remove_left();
    }
    this.left = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
    }
  }

  set_right(node) {
    if(this.right !== null) {
      this.remove_right();
    }
    this.right = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
    }
  }

  rotate_left() {
    const r = this.right;
    const p = this.prt, is_left = (p !== null && p.is_left(this));
    if(r === null) {
      return null;
    }
    this.set_right(r.left);
    r.set_left(this);

    if(p !== null) {
      if(is_left) {
        p.set_left(r);
      } else {
        p.set_right(r);
      }
    }
    return r;
  }

  rotate_right() {
    const l = this.left;
    const p = this.prt, is_left = (p !== null && p.is_left(this));
    if(l === null) {
      return null;
    }
    this.set_left(l.right);
    l.set_right(this);

    if(p !== null) {
      if(is_left) {
        p.set_left(l);
      } else {
        p.set_right(l);
      }
    }
    return l;
  }

  is_left(node) {
    return this.left === node;
  }

  is_right(node) {
    return this.right === node;
  }
}
BaseNode.node_id_gen = 0;
