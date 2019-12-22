"use strict";

// get a random integer within [0, x)
function randint(x) {
  return Math.floor(Math.random() * x);
}

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.id = ++node_id_gen;
    this.size = 1;
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
      this.size -= left.size;
    }
    return left;
  }
  remove_right() {
    const right = this.right;
    if(right !== null) {
      this.right = right.prt = null;
      this.size -= right.size;
    }
    return right;
  }

  set_left(node) {
    this.remove_left();

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
      this.size += node.size;
    }

    this.left = node;
  }

  set_right(node) {
    this.remove_right();

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
      this.size += node.size;
    }
    this.right = node;
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

  update_size() {
    let size = 1;
    if(this.left !== null) size += this.left.size;
    if(this.right !== null) size += this.right.size;
    return this.size = size;
  }
}

class RandomizedBinarySearchTree {
  constructor() {
    this.root = null;
    this.left = this.right = null;
    this.pv = -1;
    this.cur = null;
    this.update_nodes = new Set();
    this.prv_d = -1;
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

  find(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      return false;
    }
    let node = this.root;
    while(node.val !== x) {
      this.update_nodes.add(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }
    if(node.val === x) {
      return true;
    }
    return false;
  }

  finish_delete() {
    let node = this.cur;
    while(node !== null) {
      node.update_size();
      node = node.prt;
    }
  }

  delete_step() {
    if(this.left === null || this.right === null) {
      const node = (this.left || this.right);
      if(node !== null) {
        this.update_nodes.add(node);
      }
      if(this.prv_d == 0) {
        this.cur.set_left(node);
      } else if(this.prv_d == 1) {
        this.cur.set_right(node);
      } else {
        this.root = node;
      }
      this.cur = node;
      this.left = this.right = null;
      return false;
    }
    const a = this.left.size, b = this.right.size;
    if(randint(a + b) < a) {
      const left = this.left;
      this.update_nodes.add(left);
      if(this.prv_d === 0) {
        this.cur.set_left(left);
      } else if(this.prv_d === 1) {
        this.cur.set_right(left);
      } else {
        this.root = left;
      }
      this.cur = left;
      this.left = left.remove_right();
      this.prv_d = 1;
    } else {
      const right = this.right;
      this.update_nodes.add(right);
      if(this.prv_d === 1) {
        this.cur.set_right(right);
      } else if(this.prv_d === 0) {
        this.cur.set_left(right);
      } else {
        this.root = right;
      }
      this.cur = right;
      this.right = right.remove_left();
      this.prv_d = 0;
    }
    return true;
  }

  prepare_delete(x) {
    let node = this.root;
    while(node !== null) {
      if(node.val === x) break;
      this.update_nodes.add(node);
      if(x < node.val) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    if(node === null) {
      return null;
    }

    if(node.prt !== null) {
      const prt = node.prt;
      this.prv_d = (prt.is_left(node) ? 0 : 1);
      prt.remove_child(node);
      this.cur = prt;
    } else {
      this.prv_d = -1;
      this.root = this.cur = null;
    }

    this.left = node.remove_left();
    this.right = node.remove_right();
    return node;
  }

  insert_step() {
    const node = this.cur;
    if(node === null) {
      return false;
    }
    this.update_nodes.add(node);
    if(node.val < this.pv) {
      const left = this.left;
      if(left.val == this.pv) {
        left.set_left(node);
      } else {
        left.set_right(node);
      }
      this.cur = node.remove_right();
      this.left = node;
    } else {
      const right = this.right;
      if(right.val == this.pv) {
        right.set_right(node);
      } else {
        right.set_left(node);
      }
      this.cur = node.remove_left();
      this.right = node;
    }
    return true;
  }

  finish_insert() {
    let node;
    node = this.left;
    while(node !== null) {
      node.update_size();
      node = node.prt;
    }
    node = this.right;
    while(node !== null) {
      node.update_size();
      node = node.prt;
    }
  }

  prepare_insert(x) {
    // before insert(), check if key = x does not exist in the tree
    this.update_nodes = new Set();
    const new_node = new Node(x);
    this.left = this.right = new_node;
    let prv = null;
    this.pv = x;
    if(this.root == null) {
      this.root = new_node;
      this.cur = null;
      return new_node;
    }
    let node = this.root;
    while(node !== null) {
      if(node.size <= randint(node.size + 1)) {
        break;
      }
      prv = node;
      this.update_nodes.add(node);
      if(x < node.val) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    if(prv !== null) {
      if(x < prv.val) {
        prv.set_left(new_node);
      } else {
        prv.set_right(new_node);
      }
    } else {
      this.root = new_node;
    }

    this.cur = node;
    return new_node;
  }

  get_update_nodes() {
    return this.update_nodes;
  }
}

const rbst = new RandomizedBinarySearchTree();

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
    d: [{value: (el) => {
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

  const remove_tree_node = (v) => {
    const tree = rbst;
    const node_num = Object.keys(node_view).length;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    tl.add({
      duration: 500,
    });

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      max_depth = result_m[1];
    }

    const update_nodes = new Set();

    let v_n_id = null;
    let targetNode = null;
    if(tree.find(v)) {
      const node = tree.prepare_delete(v);

      targetNode = node_view[v].node;
      v_n_id = node.id;

      tl.add({
        targets: [`path.edge${v_n_id}`],
        opacity: 0,
        duration: 500,
        easing: 'linear',
      }).add({
        targets: [`g.node${v_n_id}`],
        opacity: 0,
        duration: 500,
        easing: 'linear',
      });

      let updated = true;
      while(tree.delete_step()) {
        const result = {};
        const result_l = traverse(tree.left);
        const result_m = traverse(tree.root);
        const result_r = traverse(tree.right);

        max_depth = Math.max(max_depth, result_m[1]);

        const tmp = [];
        for(let n_id in result_m[0]) {
          const v = result_m[0][n_id];
          const node = node_map[n_id];
          tmp.push([node, v[1]]);
        }
        const c_base = (tree.cur !== null ? result_m[0][tree.cur.id][1] : 0);
        max_depth = Math.max(max_depth, result_l[1] + c_base + 2, result_r[1] + c_base + 2);
        for(let n_id in result_l[0]) {
          const v = result_l[0][n_id];
          const node = node_map[n_id];
          tmp.push([node, v[1] + c_base + 2]);
        }
        for(let n_id in result_r[0]) {
          const v = result_r[0][n_id];
          const node = node_map[n_id];
          tmp.push([node, v[1] + c_base + 2]);
        }
        tmp.push([node, 0]);
        tmp.sort((x, y) => x[0].val - y[0].val);
        let cursor = 0;
        for(let e of tmp) {
          const node = e[0], pos = e[1];
          result[node.id] = [cursor++, pos];
        }
        translate_obj(result, tl);
      }

      tree.finish_delete();

      {
        const result_m = traverse(tree.root);
        const result = result_m[0];
        result[v_n_id] = [0, 0];
        max_depth = Math.max(max_depth, result_m[1]);

        translate_obj(result_m[0], tl);
      }

      for(let e of tree.get_update_nodes()) {
        update_nodes.add(e);
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

    if(targetNode !== null) {
      targetNode.find("circle").removeClass("normal-node").addClass("target-node");
    }
    for(let node of update_nodes) {
      if(v === node.val) continue;
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      if(targetNode !== null) {
        targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      }
      for(let node of update_nodes) {
        if(v === node.val) continue;
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }

      if(v_n_id !== null) {
        // remove selected node
        removeNode(v_n_id);
        removeEdge(v_n_id);
      }
    };

    change_canvas_size(
      (node_num+2) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    const tree = rbst;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    tl.add({
      duration: 500,
    });

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      max_depth = result_m[1];
    }

    if(!tree.find(v)) {
      const node = tree.prepare_insert(v);
      const v_n_id = node.id;
      if(node !== null) {
        add_node(v, node.id);
        node_map[node.id] = node;
      }
      let updated = true;
      while(true) {
        const result = {};
        const result_m = traverse(tree.root);
        const result_c = traverse(tree.cur);

        max_depth = Math.max(max_depth, result_m[1]);
        const tmp = [];

        for(let n_id in result_m[0]) {
          const v = result_m[0][n_id];
          const node = node_map[n_id];
          tmp.push([node, v[1]]);
        }
        const c_base = Math.max(result_m[0][tree.left.id][1], result_m[0][tree.right.id][1]);
        max_depth = Math.max(max_depth, result_c[1] + c_base + 2);
        for(let n_id in result_c[0]) {
          const v = result_c[0][n_id];
          const node = node_map[n_id];
          tmp.push([node, v[1] + c_base + 2]);
        }
        tmp.sort((x, y) => x[0].val - y[0].val);
        let cursor = 0;
        for(let e of tmp) {
          const node = e[0], pos = e[1];
          result[node.id] = [cursor++, pos];
        }
        translate_obj(result, tl);

        if(!updated) {
          break;
        }
        updated = tree.insert_step();
      }

      tree.finish_insert();
    }

    const targetNode = node_view[v].node;

    const update_nodes = tree.get_update_nodes();
    targetNode.find("circle").removeClass("normal-node").addClass("target-node");
    for(let node of update_nodes) {
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      for(let node of update_nodes) {
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }
    };
    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      (node_num+2) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  $(".add-random").click((el) => {
    const v = Math.floor(Math.random()*1000);
    add_tree_node(v);
  });

  $(".remove-random").click((el) => {
    const vs = Object.keys(node_view);
    if(vs.length > 0) {
      const v = parseInt(vs[Math.floor(Math.random() * vs.length)]);
      remove_tree_node(v);
    }
  });

  $(".add").click((el) => {
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      add_tree_node(v);
    }
  });

  $(".remove").click((el) => {
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      remove_tree_node(v);
    }
  });
};
