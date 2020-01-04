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
    this.rebuild_nodes = [];
  }

  clear() {
    this.root = null;
    this.cur = null;
    this.dir = -1;
    this.prt = null;
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

  collect_nodes(node) {
    this.rebuild_nodes = [];
    const es = this.rebuild_nodes;
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
  }

  build_nodes() {
    const es = this.rebuild_nodes;
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
    this.rebuild_nodes = [];
    return r;
  }

  prepare_rebuild() {
    if(this.cur === null) {
      return false;
    }

    const node = this.cur;

    const prt = node.prt;
    this.prt = prt;
    if(prt === null) {
      this.root = null;
    } else {
      if(prt.is_left(node)) {
        prt.remove_left();
        this.dir = 0;
      } else {
        prt.remove_right();
        this.dir = 1;
      }
      let cur = prt;
      while(cur !== null) {
        cur.update_size();
        cur = cur.prt;
      }
    }
    this.collect_nodes(node);
    return true;
  }

  rebuild() {
    if(this.cur === null) {
      return false;
    }

    const node = this.cur;
    this.cur = null;

    const prt = this.prt;
    if(prt === null) {
      this.root = this.build_nodes();
    } else {
      if(this.dir === 0) {
        prt.set_left(this.build_nodes());
      } else {
        prt.set_right(this.build_nodes());
      }
      let cur = prt;
      while(cur !== null) {
        cur.update_size();
        cur = cur.prt;
      }
    }
    this.cur = null;
    return true;
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values());
  }

  get_disable_nodes() {
    return this.disable_nodes;
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
  const tree = new ScapegoatTree();

  const node_view = {};
  const node_map = {};
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
      "hidden": false,
    };
    node_map[n_id] = node;
  };

  const change_canvas_size = (width, height) => {
    const style = canvas.style;
    style["width"] = `${width}px`;
    style["height"] = `${height}px`;
  };

  const set_node_status = (target_node, update_nodes, disable_nodes, is_delete) => {
    if(target_node !== null) {
      const clist = target_node.querySelector("circle").classList;
      clist.remove("normal-node");
      clist.remove("deleted-node");
      clist.add("target-node");
    }
    for(let node of update_nodes) {
      if(disable_nodes.has(node) || node === target_node) {
        continue;
      }
      const update_node = node_view[node.val].node;
      const clist = update_node.querySelector("circle").classList;
      clist.remove("normal-node");
      clist.add("update-node");
    }
    tl.complete = () => {
      if(target_node !== null) {
        const clist = target_node.querySelector("circle").classList;
        clist.remove("target-node");
        if(is_delete) {
          clist.add("deleted-node");
        } else {
          clist.add("normal-node");
        }
      }
      for(let node of update_nodes) {
        if(disable_nodes.has(node) || node === target_node) {
          continue;
        }
        const update_node = node_view[node.val].node;
        const clist = update_node.querySelector("circle").classList;
        clist.remove("update-node");
        clist.add("normal-node");
      }

      for(let node of disable_nodes) {
        removeNode(node.id);
        removeEdge(node.id);
      }
    };
  };

  const remove_tree_node = (v) => {
    disable_alpha();

    const node_num = tree.get_size();

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = translate_tree(tree);

    let disable_nodes = new Set();
    let target_node = null;

    const node = tree.remove(v);
    if(node !== null) {
      target_node = node_view[v].node;
      if(tree.prepare_rebuild()) {
        max_depth = Math.max(max_depth, translate_tree(tree, true));
        tl.add({ duration: 200 });
        tree.rebuild();
        max_depth = Math.max(max_depth, translate_tree(tree));
      }

      disable_nodes = tree.get_disable_nodes();

      for(let node of disable_nodes) {
        delete node_view[node.val];
        delete node_map[node.id];
      }
    }

    const update_nodes = tree.get_update_nodes();
    set_node_status(target_node, update_nodes, disable_nodes, true);

    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  }

  const translate_tree = (tree, rebuilding) => {
    const result_m = traverse(tree.root);
    const result = {};
    const tmp = [];
    const r_base = result_m.depth;
    let max_depth = result_m.depth;
    for(let n_id in result_m.ps) {
      const v = result_m.ps[n_id];
      const node = node_map[n_id];
      tmp.push([node, v[1], 0])
    }
    if(rebuilding) {
      const result_r = tree.rebuild_nodes;
      for(let node of result_r) {
        tmp.push([node, 0, 1]);
      }
      max_depth = Math.max(max_depth, r_base+2);
    }
    tmp.sort((x, y) => x[0].val - y[0].val);
    let cursor = 0, flp = 1;
    for(let e of tmp) {
      const node = e[0], pos = e[1], tp = e[2];
      if(tp === 1) {
        result[node.id] = [cursor++, r_base+flp];
        flp ^= 3;
      } else {
        result[node.id] = [cursor++, pos];
      }
    }
    const disable_nodes = tree.get_disable_nodes();
    if(disable_nodes.size > 0) {
      const c_nodes = [], c_edges = [];
      let need_hide = false;
      for(let node of disable_nodes) {
        result[node.id] = [0, 0];
        if(!node_view[node.val] || node_view[node.val].hidden) continue;
        c_nodes.push(`.node${node.id}`);
        c_edges.push(`.edge${node.id}`);
        node_view[node.val].hidden = true;
      }
      if(c_nodes.length > 0) {
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
    }
    translate_obj(node_map, result, tl);
    return max_depth;
  };

  const add_tree_node = (v) => {
    disable_alpha();

    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
    });

    let max_depth = translate_tree(tree);

    const node = tree.insert(v);
    if(node !== null) {
      add_node(v, node);
    }

    max_depth = Math.max(max_depth, translate_tree(tree));
    let disable_nodes = new Set();

    if(tree.prepare_rebuild()) {
      max_depth = Math.max(max_depth, translate_tree(tree, true));
      tl.add({ duration: 200 });
      tree.rebuild();
      max_depth = Math.max(max_depth, translate_tree(tree));
      disable_nodes = tree.get_disable_nodes();

      for(let node of disable_nodes) {
        delete node_view[node.val];
        delete node_map[node.id];
      }
    }

    const target_node = node_view[v].node;
    const update_nodes = tree.get_update_nodes().filter(node => node.val !== v);
    set_node_status(target_node, update_nodes, disable_nodes, false);

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
    const val = document.querySelector(".alpha-value").value;
    const v = parseFloat(val);
    if(!isNaN(v) && 0.5 <= v && v <= 1) {
      tree.set_alpha(v);
    }
    first = false;
    document.querySelector(".alpha-value").disabled = true;
  };

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_inc(add_tree_node);
  set_add_dec(add_tree_node);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
