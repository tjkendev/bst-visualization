"use strict";

let node_id_gen = 0;
class Node {
  constructor(val) {
    this.val = val;
    this.id = ++node_id_gen;
    this.clear();
  }

  clear() {
    this.left = this.right = null;
    this.prt = null;
    this.size = 1;
    this.exist = true;
  }

  remove_child(child) {
    if(this.left === child) {
      this.left = child.prt = null;
    }
    if(this.right === child) {
      this.right = child.prt = null;
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
    if(this.left !== null) {
      const left = this.remove_left();
      this.size -= left.size;
    }
    this.left = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
      this.size += node.size;
    }
  }

  set_right(node) {
    if(this.right !== null) {
      const right = this.remove_right();
      this.size -= right.size;
    }
    this.right = node;

    if(node !== null) {
      if(node.prt !== null) {
        node.prt.remove_child(node);
      }
      node.prt = this;
      this.size += node.size;
    }
  }

  size_left() {
    if(this.left === null) {
      return 0;
    }
    return this.left.size;
  }

  size_right() {
    if(this.right === null) {
      return 0;
    }
    return this.right.size;
  }

  enable() {
    if(this.exist) return false;
    this.exist = true;
    return true;
  }

  disable() {
    if(!this.exist) return false;
    this.exist = false;
    return true;
  }

  update_size() {
    this.size = 1 + this.size_left() + this.size_right();
    return this.size;
  }

  is_left(node) {
    return this.left === node;
  }
  is_right(node) {
    return this.right === node;
  }
}

class ScapegoatTree {
  constructor() {
    this.clear();
    this.alpha = 0.7;
    this.update_nodes = new Set();
    this.disable_nodes = new Set();
  }

  clear() {
    this.root = null;
    this.cur = null;
    this.disable_count = 0;
  }

  set_alpha(alpha) {
    this.alpha = alpha;
  }

  get_size() {
    if(this.root === null) {
      return 0;
    }
    return this.root.size;
  }

  find(x) {
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

  insert(x) {
    if(this.root === null) {
      this.cur = this.root = new Node(x);
      return this.root;
    }
    this.update_nodes = new Set();
    this.disable_nodes = new Set();
    let node = this.root;
    let depth = 0;
    while(node.val !== x) {
      this.update_nodes.add(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
      ++depth;
    }
    if(node.val === x) {
      if(node.enable()) {
        --this.disable_count;
      }
      return null;
    }

    const new_node = new Node(x);
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    let cur = node;
    while(cur !== null) {
      cur.update_size();
      cur = cur.prt;
    }
    cur = node;
    while(cur !== null) {
      const m_size = Math.max(cur.size_left(), cur.size_right());
      if(this.alpha * cur.size < m_size) {
        break;
      }
      cur = cur.prt;
    }
    this.cur = cur;
    return new_node;
  }

  remove(x) {
    if(this.root === null) {
      return null;
    }
    this.update_nodes = new Set();
    this.disable_nodes = new Set();
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
    if(node.val !== x) {
      return null;
    }

    if(node.disable()) {
      ++this.disable_count;
    }
    const sz = this.get_size();
    if(sz - this.disable_count <= this.alpha * sz) {
      this.cur = this.root;
    }
    return node;
  }

  rebuild_nodes(node) {
    const es = [];
    const traverse_dfs = (nd) => {
      if(nd.left !== null) {
        traverse_dfs(nd.left);
      }
      if(nd.exist) {
        es.push(nd);
        if(this.cur !== nd) {
          this.update_nodes.add(nd);
        }
      } else {
        this.disable_nodes.add(nd);
        --this.disable_count;
      }
      if(nd.right !== null) {
        traverse_dfs(nd.right);
      }
      nd.clear();
    };
    traverse_dfs(node);

    let cur = 0;
    const construct_dfs = (rest) => {
      if(rest === 1) {
        const nd = es[cur++];
        return nd;
      }
      const c = (rest >> 1);
      const left = (c > 0 ? construct_dfs(c) : null);
      const nd = es[cur++];
      const right = (c < rest-1 ? construct_dfs(rest-1-c) : null);
      nd.set_left(left);
      nd.set_right(right);
      return nd;
    };
    if(es.length < 1) {
      return null;
    }
    const r = construct_dfs(es.length);
    return r;
  }

  rebuild() {
    if(this.cur === null) {
      return false;
    }

    const node = this.cur;
    this.cur = null;

    const prt = node.prt;
    if(prt === null) {
      this.root = this.rebuild_nodes(node);
    } else {
      if(prt.is_left(node)) {
        prt.remove_left();
        prt.set_left(this.rebuild_nodes(node));
      } else {
        prt.remove_right();
        prt.set_right(this.rebuild_nodes(node));
      }
      let cur = prt;
      while(cur !== null) {
        cur.update_size();
        cur = cur.prt;
      }
    }
    return true;
  }

  get_update_nodes() {
    return this.update_nodes;
  }

  get_disable_nodes() {
    return this.disable_nodes;
  }
}

const scapegoat_tree = new ScapegoatTree();

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
    const tree = scapegoat_tree;
    const node_num = tree.get_size();

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = translate_tree(tree);

    let disable_nodes = new Set();
    let targetNode = null;

    const r = tree.remove(v);
    if(r !== null) {
      targetNode = node_view[v].node;
      const v_n_id = r.id;
      if(tree.rebuild()) {
        max_depth = Math.max(max_depth, translate_tree(tree));
      }

      disable_nodes = tree.get_disable_nodes();

      for(let node of disable_nodes) {
        delete node_view[node.val];
        delete node_map[node.id];
      }
    }

    const update_nodes = tree.get_update_nodes();
    if(targetNode !== null) {
      targetNode.find("circle").removeClass("normal-node deleted-node").addClass("target-node");
    }
    for(let node of update_nodes) {
      if(disable_nodes.has(node) || v === node.val) {
        continue;
      }
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      if(targetNode !== null) {
        targetNode.find("circle").removeClass("target-node").addClass("deleted-node");
      }
      for(let node of update_nodes) {
        if(disable_nodes.has(node) || v === node.val) {
          continue;
        }
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }

      for(let node of disable_nodes) {
        removeNode(node.id);
        removeEdge(node.id);
      }
    };

    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  }

  const translate_tree = (tree) => {
    const result_m = traverse(tree.root);
    const result = result_m[0];
    const disable_nodes = tree.get_disable_nodes();
    if(disable_nodes.size > 0) {
      const c_nodes = [], c_edges = [];
      for(let node of disable_nodes) {
        result[node.id] = [0, 0];
        c_nodes.push(`.node${node.id}`);
        c_edges.push(`.edge${node.id}`);
      }
      tl.add({
        targets: c_edges,
        opacity: 0,
        duration: 500,
        easing: 'linear',
      }).add({
        targets: c_nodes,
        opacity: 0,
        duration: 500,
        easing: 'linear',
      });
    }
    translate_obj(result, tl);
    return result_m[1];
  };

  const add_tree_node = (v) => {
    const tree = scapegoat_tree;
    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = translate_tree(tree);

    const r = tree.insert(v);
    if(r !== null) {
      const n_id = r.id;
      add_node(v, n_id);
      node_map[n_id] = r;
    }

    max_depth = Math.max(max_depth, translate_tree(tree));
    let disable_nodes = new Set();

    if(tree.rebuild()) {
      max_depth = Math.max(max_depth, translate_tree(tree));
      disable_nodes = tree.get_disable_nodes();

      for(let node of disable_nodes) {
        delete node_view[node.val];
        delete node_map[node.id];
      }
    }

    const targetNode = node_view[v].node;

    const update_nodes = tree.get_update_nodes();
    targetNode.find("circle").removeClass("normal-node deleted-node").addClass("target-node");
    for(let node of update_nodes) {
      if(disable_nodes.has(node) || v === node.val) {
        continue;
      }
      const updateNode = node_view[node.val].node;
      updateNode.find("circle").removeClass("normal-node").addClass("update-node");
    }
    tl.complete = () => {
      targetNode.find("circle").removeClass("target-node").addClass("normal-node");
      for(let node of update_nodes) {
        if(disable_nodes.has(node) || v === node.val) {
          continue;
        }
        const updateNode = node_view[node.val].node;
        updateNode.find("circle").removeClass("update-node").addClass("normal-node");
      }

      for(let node of disable_nodes) {
        removeNode(node.id);
        removeEdge(node.id);
      }
    };

    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const values = {};
  let first = true;

  const disable_alpha = () => {
    if(!first) return;
    const val = $(".alpha-value").val();
    const v = parseFloat(val);
    if(!isNaN(v) && 0.5 <= v && v <= 1) {
      scapegoat_tree.set_alpha(v);
    }
    first = false;
    $(".alpha-value").prop("disabled", true);
  };

  $(".add-random").click((el) => {
    disable_alpha();
    const v = Math.floor(Math.random()*1000);
    values[v] = 1;
    add_tree_node(v);
  });

  $(".remove-random").click((el) => {
    const vs = Object.keys(values);
    if(vs.length > 0) {
      const v = parseInt(vs[Math.floor(Math.random() * vs.length)]);
      delete values[v];
      remove_tree_node(v);
    }
  });

  $(".add").click((el) => {
    disable_alpha();
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      values[v] = 1;
      add_tree_node(v);
    }
  });

  $(".remove").click((el) => {
    const val = $(".node-key").val();
    const v = parseInt(val, 10);
    if(!isNaN(v) && 0 <= v && v <= 999) {
      delete values[v];
      remove_tree_node(v);
    }
  });
};
