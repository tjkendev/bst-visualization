"use strict";

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.left = this.right = null;
    this.prt = null;
    this.val = val;
    this.id = ++node_id_gen;
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

  finish_splaying() {
    this.pv = null;
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
      const l = x.remove_left();
      this.root = l;

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
      const r = x.remove_right();
      this.root = r;

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

  const splaying = (tl, tree, v, need_to_add) => {
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
        result[n_id] = [v[0], v[1] + 1];
      }

      cursor += Object.keys(result_l[0]).length + 2;
      for(let n_id in result_m[0]) {
        const v = result_m[0][n_id];
        result[n_id] = [v[0] + cursor, v[1]];
      }
      cursor += Object.keys(result_m[0]).length + 2;
      for(let n_id in result_r[0]) {
        const v = result_r[0][n_id];
        result[n_id] = [v[0] + cursor, v[1] + 1];
      }
      translate_obj(result, tl);

      if(!updated) break;
      if(tree.is_splaying()) {
        if(!tree.splaying_step()) {
          if(need_to_add) {
            const r = tree.insert(v);
            if(r !== null) {
              // added a new node
              const n_id = r.id;
              add_node(v, n_id);
              node_map[n_id] = r;
            }
          } else {
            tree.finish_splaying();
          }
          updated = false;
        }
      } else {
        tree.splaying_setup(v);
      }
    }

    return max_depth;
  }

  const remove_tree_node = (v) => {
    const tree = splay_tree;
    const node_num = Object.keys(node_view).length;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = splaying(tl, tree, v, false);

    const update_nodes = [];
    update_nodes.push(...tree.get_update_nodes());

    const node = tree.root;
    let v_n_id = null;
    let targetNode = null;

    if(node.val === v) {
      const left = node.remove_left(), right = node.remove_right();

      const result_l = traverse(left);

      v_n_id = node.id;
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

      if(right !== null) {
        tree.root = right;

        if(right.left !== null) {
          let updated = true;
          while(true) {
            const result = {};
            const result_m = traverse(tree.root);
            const result_r = traverse(tree.right);
            max_depth = Math.max(max_depth, result_m[1], result_r[1]);

            let cursor = 0;
            for(let n_id in result_l[0]) {
              const v = result_l[0][n_id];
              result[n_id] = [v[0], v[1] + 1];
            }
            cursor += Object.keys(result_l[0]).length + 2;
            result[v_n_id] = [cursor, 0];
            cursor += 2;
            for(let n_id in result_m[0]) {
              const v = result_m[0][n_id];
              result[n_id] = [v[0] + cursor, v[1] + 1];
            }
            cursor += Object.keys(result_m[0]).length + 2;
            for(let n_id in result_r[0]) {
              const v = result_r[0][n_id];
              result[n_id] = [v[0] + cursor, v[1] + 2];
            }
            translate_obj(result, tl);

            if(!updated) break;
            if(tree.is_splaying()) {
              if(!tree.splaying_step()) {
                tree.finish_splaying();
                updated = false;
              }
            } else {
              tree.splaying_setup(v);
            }
          }
        }

        tree.root.set_left(left);
        {
          const result_m = traverse(tree.root);
          const result = result_m[0];
          max_depth = Math.max(max_depth, result_m[1]);
          result[v_n_id] = [0, 0];
          translate_obj(result, tl);
        }
        update_nodes.push(...tree.get_update_nodes());
      } else {
        tree.root = left;
        if(left !== null) {
          const result_m = traverse(tree.root);
          const result = result_m[0];
          max_depth = Math.max(max_depth, result_m[1]);
          result[v_n_id] = [0, 0];
          translate_obj(result, tl);
        }
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

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
    const tree = splay_tree;

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    const max_depth = splaying(tl, tree, v, true);

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
