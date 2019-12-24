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
    if(node.val === x) {
      return true;
    }
    return false;
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
    return this.update_nodes;
  }
}

const bst = new BinarySearchTree();

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
    const tree = bst;
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
      const node = tree.remove(v);

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

      const result_m = traverse(tree.root);
      const result = result_m[0];
      result[v_n_id] = [0, 0];
      translate_obj(result, tl);

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
    const tree = bst;

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
      const node = tree.insert(v);

      const v_n_id = node.id;
      add_node(v, node.id);
      node_map[node.id] = node;

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
