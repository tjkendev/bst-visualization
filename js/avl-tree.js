"use strict";

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.height = 1;
    this.id = ++node_id_gen;
  }

  factor() {
    const lv = (this.left !== null ? this.left.height : 0);
    const rv = (this.right !== null ? this.right.height : 0);
    return rv - lv;
  }

  update_height() {
    this.height = Math.max(
      (this.left !== null ? this.left.height : 0),
      (this.right !== null ? this.right.height : 0)
    ) + 1;
  }

  remove_child(node) {
    if(this.left === node) {
      this.remove_left();
    }
    if(this.right === node) {
      this.remove_right();
    }
    this.update_height();
  }

  remove_left() {
    const left = this.left;
    if(left !== null) {
      this.left = left.prt = null;
    }
    this.update_height();
    return left;
  }
  remove_right() {
    const right = this.right;
    if(right !== null) {
      this.right = right.prt = null;
    }
    this.update_height();
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
    this.update_height();
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
    this.update_height();
  }

  rotate_left() {
    const r = this.right;
    const p = this.prt, is_left = (p !== null && p.is_left(this));
    if(r === null) {
      return null;
    }
    this.set_right(r.left);
    this.update_height();
    r.set_left(this);
    r.update_height();

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
    this.update_height();
    l.set_right(this);
    l.update_height();

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

class AVLTree {
  constructor() {
    this.root = null;
    this.cur = null;
    this.prt = null;
    this.update_nodes = new Set();
  }

  insert(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      return this.root = new Node(x);
    }
    let node = this.root;
    while(node !== null) {
      if(node.val === x) {
        return null;
      }
      this.update_nodes.add(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }
    const new_node = new Node(x);
    this.cur = new_node;
    this.prt = node;
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    return new_node;
  }

  remove(x) {
    this.update_nodes = new Set();
    this.cur = this.prt = null;
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

    const prt = node.prt;
    if(node.left === null || node.right === null) {
      const n_node = node.left || node.right;
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(n_node);
        } else {
          prt.set_right(n_node);
        }
        this.prt = prt;
        this.cur = n_node;
      } else {
        node.remove_child(n_node);
        this.root = n_node;
      }
    } else if(node.left !== null && node.right !== null) {
      let c_node = node.right;
      while(c_node.left !== null) {
        this.update_nodes.add(c_node);
        c_node = c_node.left;
      }
      this.update_nodes.add(c_node);
      const c_prt = c_node.prt;
      let is_child = node.is_right(c_node);
      if(!is_child) {
        c_prt.set_left(c_node.right);
        c_node.set_right(node.right);
      }
      c_node.set_left(node.left);
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(c_node);
        } else {
          prt.set_right(c_node);
        }
      } else {
        node.remove_right();
        this.root = c_node;
      }
      if(is_child) {
        this.prt = c_node;
        this.cur = c_node.right;
      } else {
        this.prt = c_prt;
        this.cur = c_prt.left;
      }
    }
    return node;
  }

  is_retracing() {
    return (this.prt !== null);
  }

  finish_retracing() {
    this.cur = this.prt = null;
  }

  insert_retracing_step() {
    const node = this.cur, prt = this.prt;
    if(prt === null) {
      return this.finish_retracing();
    }
    // assert (node !== null);
    prt.update_height();
    if(prt.is_left(node)) {
      if(prt.factor() == -2) {
        if(node.factor() > 0) {
          node.rotate_left();
          this.prt = prt.rotate_right();
          if(this.prt.prt === null) {
            this.root = node.prt;
          }
        } else {
          prt.rotate_right();
          this.prt = node.prt;
          if(node.prt === null) {
            this.root = node;
          }
        }
        return true;
      } else {
        if(prt.factor() >= 0) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
        return false;
      }
    } else {
      if(prt.factor() == 2) {
        if(node.factor() < 0) {
          node.rotate_right();
          this.prt = prt.rotate_left();
          if(this.prt.prt === null) {
            this.root = node.prt;
          }
        } else {
          prt.rotate_left();
          this.prt = node.prt;
          if(node.prt === null) {
            this.root = node;
          }
        }
        return true;
      } else {
        if(prt.factor() <= 0) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
        return false;
      }
    }
  }

  remove_retracing_step() {
    const node = this.cur, prt = this.prt;
    if(prt === null) {
      return this.finish_retracing();
    }
    prt.update_height();
    if(prt.is_left(node)) {
      if(prt.factor() == 2) {
        const sib = prt.right;
        this.update_nodes.add(sib);
        if(sib.factor() < 0) {
          this.update_nodes.add(sib.left);
          sib.rotate_right();
          this.cur = prt.rotate_left();
          this.prt = this.cur.prt;
        } else {
          this.cur = prt.rotate_left();
          this.prt = this.cur.prt;
        }
        if(this.prt === null) {
          this.root = this.cur;
        }
        return true;
      } else {
        if(prt.factor() == 1) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
        if(this.prt === null) {
          this.root = this.cur;
        }
        return false;
      }
    } else {
      if(prt.factor() == -2) {
        const sib = prt.left;
        this.update_nodes.add(sib);
        if(sib.factor() > 0) {
          this.update_nodes.add(sib.right);
          sib.rotate_left();
          this.cur = prt.rotate_right();
          this.prt = this.cur.prt;
        } else {
          this.cur = prt.rotate_right();
          this.prt = this.cur.prt;
        }
        if(this.prt === null) {
          this.root = this.cur;
        }
        return true;
      } else {
        if(prt.factor() == -1) {
          return this.finish_retracing();
        }
        this.cur = prt;
        this.prt = prt.prt;
        if(this.prt === null) {
          this.root = this.cur;
        }
        return false;
      }
    }
  }

  get_update_nodes() {
    return this.update_nodes;
  }

  retracing(v) {
    while(this.is_retracing()) this.insert_retracing_step();
  }
}

const avl_tree = new AVLTree();

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
    const tree = avl_tree;
    const node_num = Object.keys(node_view).length;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      max_depth = result_m[1];
    }

    tl.add({
      duration: 1000,
    });

    let v_n_id = null;
    let targetNode = null;

    const r = tree.remove(v);
    if(r !== null) {
      v_n_id = r.id;
      targetNode = node_view[v].node;

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

      {
        const result_m = traverse(tree.root);
        const result = result_m[0];
        result[v_n_id] = [0, 0];
        translate_obj(result, tl);
      }

      while(tree.is_retracing()) {
        if(!tree.remove_retracing_step()) {
          continue;
        }
        const result_m = traverse(tree.root);
        const result = result_m[0];
        result[v_n_id] = [0, 0];
        translate_obj(result, tl);
        max_depth = Math.max(max_depth, result_m[1]);
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = tree.get_update_nodes();

    if(targetNode !== null) {
      targetNode.find("circle").removeClass("normal-node").addClass("target-node");
    }
    for(let node of update_nodes) {
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      if(targetNode !== null) {
        targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      }
      for(let node of update_nodes) {
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
      (node_num+5) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    const tree = avl_tree;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = 0;

    const r = tree.insert(v);
    if(r !== null) {
      // add a new node
      const n_id = r.id;
      add_node(v, n_id);
      node_map[n_id] = r;
    }

    {
      const result_m = traverse(tree.root);
      translate_obj(result_m[0], tl);
      max_depth = Math.max(max_depth, result_m[1]);
    }

    while(tree.is_retracing()) {
      if(!tree.insert_retracing_step()) {
        continue;
      }
      const result_m = traverse(tree.root);
      translate_obj(result_m[0], tl);
      max_depth = Math.max(max_depth, result_m[1]);
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
      (node_num+5) * NODE_W + BASE_X*2,
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
