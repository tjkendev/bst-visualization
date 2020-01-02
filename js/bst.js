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
    this.remove_left();

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
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
    }
    this.right = node;
  }

  is_left(node) {
    return this.left === node;
  }

  is_right(node) {
    return this.right === node;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
    this.update_nodes = new Set();
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
    return (node.val === x);
  }

  remove(x) {
    this.update_nodes = new Set();
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
      if(!node.is_right(c_node)) {
        c_prt.set_left(c_node.right);
        c_node.set_right(node.right);
      }
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
      c_node.set_left(node.left);
    }
    return node;
  }

  insert(x) {
    this.update_nodes = new Set();
    const new_node = new Node(x);
    let prv = null;
    if(this.root == null) {
      this.root = new_node;
      this.cur = null;
      return new_node;
    }
    let node = this.root;
    while(node !== null) {
      if(node.val === x) {
        return null;
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
    return new_node;
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values());
  }
}

function translate_obj(node_map, result, tl) {
  tl.add({
    targets: ['g.node'],
    translateX: (el) => {
      const n_id = el.getAttribute("nid");
      return get_node_px(result[n_id]);
    },
    translateY: (el) => {
      const n_id = el.getAttribute("nid");
      return get_node_py(result[n_id]);
    },
    duration: 1000,
    easing: 'linear',
  }).add({
    targets: ['path.edge'],
    d: [{value: (el) => {
      const n_id = el.getAttribute("nid");
      const node = node_map[n_id];
      const [fx, fy] = get_edge_pos(result[n_id]);

      const l_child = node.left, r_child = node.right;
      let l_tx = fx, l_ty = fy;
      if(l_child !== null) {
        [l_tx, l_ty] = get_edge_pos(result[l_child.id]);
      }
      let r_tx = fx, r_ty = fy;
      if(r_child !== null) {
        [r_tx, r_ty] = get_edge_pos(result[r_child.id]);
      }
      return `M${l_tx},${l_ty}L${fx},${fy}L${r_tx},${r_ty}`;
    }}],
    offset: '-=1000',
    duration: 1000,
    easing: 'linear',
  });
}

window.onload = () => {
  const tree = new BinarySearchTree();

  const node_view = {}, node_map = {};
  let tl = null;

  const canvas = document.querySelector("svg.canvas");
  const nodes = document.querySelector(".nodes");
  const edges = document.querySelector(".edges");

  const add_node = (v, node) => {
    const n_id = node.id;
    nodes.appendChild(createNode(v, n_id));
    edges.appendChild(createEdge(v, n_id));
    const d_node = document.querySelector(`g.node${n_id}`);
    const d_edge = document.querySelector(`path.edge${n_id}`);

    node_view[v] = {
      "node": d_node,
      "edge": d_edge,
    };
    node_map[n_id] = node;
  };

  const change_canvas_size = (width, height) => {
    const style = canvas.style;
    style["width"] = `${width}px`;
    style["height"] = `${height}px`;
  };

  const remove_tree_node = (v) => {
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

    const max_depth = traverse(tree.root).depth;

    let v_n_id = null;
    let target_node = null;
    if(tree.find(v)) {
      const node = tree.remove(v);

      target_node = node_view[v].node;
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

      const result = traverse(tree.root).ps;
      result[v_n_id] = [0, 0];
      translate_obj(node_map, result, tl);

      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);
    begin_change_color(target_node, update_nodes);
    tl.complete = () => {
      end_change_color(target_node, update_nodes);

      if(v_n_id !== null) {
        removeNode(v_n_id);
        removeEdge(v_n_id);
      }
    };

    change_canvas_size(
      node_num * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    tl.add({
      duration: 500,
    });

    let max_depth = traverse(tree.root).depth;

    if(!tree.find(v)) {
      const node = tree.insert(v);

      add_node(v, node);

      const result_m = traverse(tree.root);
      translate_obj(node_map, result_m.ps, tl);
      max_depth = Math.max(max_depth, result_m.depth);
    }

    const target_node = node_view[v].node;

    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);
    begin_change_color(target_node, update_nodes);
    tl.complete = () => {
      end_change_color(target_node, update_nodes);
    };
    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      node_num * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
