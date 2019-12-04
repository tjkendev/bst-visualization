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

class TopDownSplayTree {
  constructor() {
    this.root = null;
    this.left = this.left_c = null;
    this.right = this.right_c = null;
    this.pv = null;
    this.update_nodes = [];
  }
  add_left(node) {
    if(this.left === null) {
      this.left = this.left_c = node;
      return;
    }
    this.left_c.set_right(node);
    this.left_c = node;
  }
  add_right(node) {
    if(this.right === null) {
      this.right = this.right_c = node;
      return;
    }
    this.right_c.set_left(node);
    this.right_c = node;
  }

  splaying_setup(v) {
    this.pv = v;
    this.update_nodes = [];
  }

  is_splaying() {
    return this.pv !== null;
  }

  insert(x) {
    // call this function after splaying is complete
    const root = this.root;
    this.pv = null;
    if(root === null) {
      return this.root = new Node(x);
    }
    if(root.val === x) {
      return null;
    }
    const new_node = new Node(x);
    if(x < root.val) {
      new_node.set_left(root.left);
      new_node.set_right(root);
    } else {
      new_node.set_right(root.right);
      new_node.set_left(root);
    }
    this.root = new_node;
    return new_node;
  }

  build() {
    // assert (this.root !== null)
    const root = this.root;
    if(this.left_c !== null) {
      this.left_c.set_right(root.left);
    }
    if(this.right_c !== null) {
      this.right_c.set_left(root.right);
    }
    if(this.left !== null) {
      root.set_left(this.left);
    }
    if(this.right !== null) {
      root.set_right(this.right);
    }
    this.left = this.right = null;
    this.left_c = this.right_c = null;
    return false;
  }

  get_update_nodes() {
    return this.update_nodes;
  }

  splaying_step() {
    let x = this.root;
    if(x === null) {
      return false;
    }
    // assert (x !== null);
    if(x.val == this.pv) {
      return this.build();
    }
    this.update_nodes.push(x);
    if(this.pv < x.val) {
      const y = x.left;
      if(y === null) return this.build();

      if(this.pv < y.val) {
        // zig-zig (first rotation)
        x.rotate_right();
        this.update_nodes.push(y);
        if(y.left === null) {
          this.root = y;
          return true;
        }
        x = y;
      }
      // zig-zig (second rotation) or zig-zag (simplified)
      const l = x.left;
      this.root = l;
      x.remove_child(l);

      this.add_right(x);
    } else {
      const y = x.right;
      if(y === null) return this.build();

      if(y.val < this.pv) {
        // zig-zig (first rotation)
        x.rotate_left();
        this.update_nodes.push(y);
        if(y.right === null) {
          this.root = y;
          return true;
        }
        x = y;
      }
      // zig-zig (second rotation) or zig-zag (simplified)
      const r = x.right;
      this.root = r;
      x.remove_child(r);

      this.add_left(x);
    }
    return true;
  }
  splaying(v) {
    splaying_setup(v);
    while(splaying_step());
  }
}

const splay_tree = new TopDownSplayTree();

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
    targets: ['path.edge-l', 'path.edge-r'],
    d: [{value: function(el) {
      const n_id = $(el).attr("nid");
      const node = node_map[n_id], f = result[n_id];
      const fx = f[0] * NODE_W + 10 + BASE_X, fy = f[1] * NODE_H + 10 + BASE_Y;
      const child = ($(el).hasClass('edge-l') ? node.left : node.right);
      if(child !== null) {
        const t = result[child.id];
        const tx = t[0] * NODE_W + 10 + BASE_X, ty = t[1] * NODE_H + 10 + BASE_Y;
        return `M${fx},${fy}L${tx},${ty}`;
      }
      return `M${fx},${fy}L${fx},${fy}`;
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
    edges.append(createEdge(v, n_id, 'l'));
    edges.append(createEdge(v, n_id, 'r'));
    const node = $(`g.node${n_id}`);
    const path_l = $(`path.edge${n_id}-l`);
    const path_r = $(`path.edge${n_id}-r`);

    node_view[v] = {
      "node": node,
      "edge_l": path_l,
      "edge_r": path_r,
    };
  };

  const change_canvas_size = (width, height) => {
    canvas.css({
      "width": `${width}px`,
      "height": `${height}px`,
    });
  };

  const add_tree_node = (v) => {
    const tree = splay_tree;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = 0;

    let updated = true;
    while(true) {
      const result = {};
      const result_l = traverse(tree.left);
      const result_m = traverse(tree.root);
      const result_r = traverse(tree.right);

      max_depth = Math.max(max_depth, result_l[1], result_m[1], result_r[1]);

      let cursor = 0;
      for(let n_id in result_l[0]) {
        const v = result_l[0][n_id];
        result[n_id] = v;
      }
      cursor += Object.keys(result_l[0]).length + 2;
      for(let n_id in result_m[0]) {
        const v = result_m[0][n_id];
        result[n_id] = [v[0] + cursor, v[1]];
      }
      cursor += Object.keys(result_m[0]).length + 2;
      for(let n_id in result_r[0]) {
        const v = result_r[0][n_id];
        result[n_id] = [v[0] + cursor, v[1]];
      }
      translate_obj(result, tl);

      if(!updated) break;
      if(tree.is_splaying()) {
        if(!tree.splaying_step()) {
          const r = tree.insert(v);
          if(r !== null) {
            // added a new node
            const n_id = r.id;
            add_node(v, n_id);
            node_map[n_id] = r;
          }
          updated = false;
        }
      } else {
        tree.splaying_setup(v);
      }
    }

    const targetNode = node_view[v].node;

    const update_nodes = tree.get_update_nodes();
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
      (node_num+5) * NODE_W + BASE_X*2,
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
