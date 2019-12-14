"use strict";

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.id = ++node_id_gen;
  }

  remove_child(child) {
    if(this.left === child) {
      this.left = child.prt = null;
    }
    if(this.right === child) {
      this.right = child.prt = null;
    }
  }

  set_left(node) {
    if(this.left !== null) {
      this.remove_child(this.left);
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
      this.remove_child(this.right);
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

class BottomUpSplayTree {
  constructor() {
    this.clear();
    this.update_nodes = [];
  }

  clear() {
    this.root = null;
    this.cur = null;
  }

  find_or_insert(x) {
    this.update_nodes = [];
    if(this.root === null) {
      this.root = new Node(x);
      this.cur = null;
      return this.root;
    }
    let node = this.root;
    while(node.val !== x) {
      this.update_nodes.push(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }
    if(x === node.val) {
      this.cur = node;
      return null;
    }

    const new_node = new Node(x);
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    this.cur = new_node;
    return new_node;
  }

  get_update_nodes() {
    return this.update_nodes;
  }

  splaying() {
    while(splaying_step());
  }

  splaying_step() {
    if(this.cur === null) {
      return false;
    }
    const x = this.cur;
    if(x.prt === null) {
      this.root = x;
      this.cur = null;
      return false;
    }
    const y = x.prt;
    if(y.prt === null) {
      // zig
      x.prt = null;
      if(y.is_left(x)) {
        y.rotate_right();
      } else {
        y.rotate_left();
      }
      this.root = x;
      this.cur = null;
      return true;
    }
    const z = y.prt;
    if(y.is_left(x)) {
      if(z.is_left(y)) {
        // zig-zig
        z.rotate_right();
        y.rotate_right();
      } else {
        // zig-zag
        y.rotate_right();
        z.rotate_left();
      }
    } else {
      if(z.is_left(y)) {
        // zig-zag
        y.rotate_left();
        z.rotate_right();
      } else {
        // zig-zig
        z.rotate_left();
        y.rotate_left();
      }
    }
    if(x.prt === null) {
      this.root = x;
      this.cur = null;
      return false;
    }
    return true;
  }
}

const splay_tree = new BottomUpSplayTree();

const node_view = {};
const node_map = {};
let tl = null;
const NODE_W = 20, NODE_H = 40;
const BASE_X = 35, BASE_Y = 15;

function translate_obj(result, tl) {
  tl.add({
    targets: ['g.node'],
    translateX: (el) => {
      const n_id = $(el).attr("nid");
      return result[n_id][0] * NODE_W + BASE_X;
    },
    translateY: (el) => {
      const n_id = $(el).attr("nid");
      return result[n_id][1] * NODE_H + BASE_Y;
    },
    duration: 1000,
    easing: 'linear',
  }).add({
    targets: ['path.edge'],
    d: [{value: function(el) {
      const n_id = $(el).attr("nid");
      const node = node_map[n_id], f = result[n_id];
      const fx = f[0] * NODE_W + 10 + BASE_X, fy = f[1] * NODE_H + 10 + BASE_Y;

      const l_child = node.left, r_child = node.right;
      let l_tx = fx, l_ty = fy;
      if(l_child !== null) {
        const t = result[l_child.id];
        l_tx = t[0] * NODE_W + 10 + BASE_X;
        l_ty = t[1] * NODE_H + 10 + BASE_Y;
      }
      let r_tx = fx, r_ty = fy;
      if(r_child !== null) {
        const t = result[r_child.id];
        r_tx = t[0] * NODE_W + 10 + BASE_X;
        r_ty = t[1] * NODE_H + 10 + BASE_Y;
      }
      return `M${l_tx},${l_ty}L${fx},${fy}L${r_tx},${r_ty}`;
    }}],
    offset: '-=1000',
    duration: 1000,
    easing: 'linear',
  });
}

window.onload = () => {
  const canvas = $("svg.canvas");
  const nodes = canvas.find(".nodes");
  const edges = canvas.find(".edges");

  const add_node = (v, n_id) => {
    nodes.append(createNode(v, n_id));
    edges.append(createEdge(v, n_id));
    const node = $(`g.node${n_id}`);
    const edge = $(`path.edge${n_id}`);

    node_view[v] = {
      "node": node,
      "edge": edge,
    };
  };

  const change_canvas_size = (width, height) => {
    canvas.css({
      "width": `${width}px`,
      "height": `${height}px`,
    });
  };

  const add_tree_node = (v) => {
    const r = splay_tree.find_or_insert(v);
    if(r !== null) {
      const n_id = r.id;
      add_node(v, n_id);
      node_map[n_id] = r;
    }
    let tm = 0;
    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let updated = true;
    let count = 0;
    let max_depth = 0;
    while(true) {
      const result = traverse(splay_tree.root);

      max_depth = Math.max(max_depth, result[1]);

      translate_obj(result[0], tl);
      if(!updated) {
        break;
      }
      updated = splay_tree.splaying_step();
      tm += 1000;
      ++count;
    }

    const targetNode = node_view[v].node;

    const update_nodes = splay_tree.get_update_nodes();
    targetNode.find("circle").removeClass("normal-node").addClass("target-node");
    for(let node of update_nodes) {
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = function() {
      targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      for(let node of update_nodes) {
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }
    };

    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  $(".add-random").click((el) => {
    const v = Math.floor(Math.random()*1000);
    add_tree_node(v);
  });

  $(".add").click((el) => {
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      add_tree_node(v);
    }
  });
};
