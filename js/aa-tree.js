"use strict";

class Node extends BaseNode {
  constructor(val) {
    super(val);
    this.level = 1;
  }

  get_sib(node) {
    return (this.is_left(node) ? this.right : this.left);
  }
}

Object.defineProperty(Node, 'BLACK', {
  value: 0,
  writable: false,
  enumerable: true,
  configurable: false,
});

Object.defineProperty(Node, 'RED', {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false,
});

class AATree {
  constructor() {
    this.clear();
    this.update_nodes = [];
    this.current_nodes = [];
  }

  clear() {
    this.root = null;
    this.cur = null;
    this.dnode_color = null;
  }

  static get_level(node) {
    return (node !== null ? node.level : 0);
  }

  static needToSkew(node) {
    if(node === null) return false;
    const left = node.left;
    return (
         left !== null &&
         node.level === left.level
    );
  }

  static skew(node) {
    if(AATree.needToSkew(node)) {
      return node.rotate_right();
    }
    return node;
  }

  static needToSplit(node) {
    if(node === null) return false;
    const right = node.right;
    return (
         right !== null &&
         right.right !== null &&
         node.level === right.right.level
    );
  }

  static split(node) {
    if(AATree.needToSplit(node)) {
      const right = node.rotate_left();
      right.level += 1;
      return right;
    }
    return node;
  }

  find_node(root, x) {
    if(root === null) {
      return null;
    }
    let node = root;
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
    return node;
  }

  *insert(x) {
    this.update_nodes = new Set();
    this.current_nodes = [];
    if(this.root === null) {
      this.root = new Node(x);
      this.current_nodes = [this.root];
      yield this.root;
      return;
    }

    let node = this.find_node(this.root, x);
    if(node.val === x) {
      return;
    }

    const new_node = new Node(x);
    this.current_nodes = [new_node];
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    yield new_node;

    node = new_node;
    while(node !== null) {
      if(AATree.needToSkew(node)) {
        this.current_nodes = [node, node.left];
        this.update_nodes.add(node.left);
        node = AATree.skew(node);
        if(node.prt === null) {
          this.root = node;
        }
        yield;
      }
      if(AATree.needToSplit(node)) {
        this.current_nodes = [node, node.right, node.right.right];
        this.update_nodes.add(node.right).add(node.right.right);
        node = AATree.split(node);
        if(node.prt === null) {
          this.root = node;
        }
        yield;
      }
      node = node.prt;
    }
    this.current_nodes = [];
  }

  *remove(x) {
    this.update_nodes = new Set();
    this.current_nodes = [];
    if(this.root === null) {
      return;
    }

    let node = this.find_node(this.root, x);
    if(node.val !== x) {
      this.update_nodes.add(node);
      return;
    }
    const prt = node.prt;
    if(node.left === null && node.right === null) {
      this.current_nodes = [node];
      if(prt !== null) {
        prt.remove_child(node);
      } else {
        this.root = null;
      }
      yield node;
      node = prt;
    } else if(node.left === null) {
      // find successor(x) (= c_node)
      let c_node = this.find_node(node.right, x);
      this.current_nodes = [node, c_node];
      this.update_nodes.add(c_node);
      const c_prt = c_node.prt;
      // c_node is a leaf
      if(!node.is_right(c_node)) {
        c_node.set_right(node.right);
      }
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(c_node);
        } else {
          prt.set_right(c_node);
        }
      } else {
        c_prt.remove_child(c_node);
        this.root = c_node;
      }
      c_node.set_left(node.left);
      c_node.level = node.level;
      yield node;
      node = (c_prt !== node ? c_prt : c_node);
    } else {
      // find predecessor(x) (= c_node)
      let c_node = this.find_node(node.left, x);
      this.current_nodes = [node, c_node];
      this.update_nodes.add(c_node);
      const c_prt = c_node.prt;
      // c_node is a leaf
      if(!node.is_left(c_node)) {
        c_node.set_left(node.left);
      }
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(c_node);
        } else {
          prt.set_right(c_node);
        }
      } else {
        c_prt.remove_child(c_node);
        this.root = c_node;
      }
      c_node.set_right(node.right);
      c_node.level = node.level;
      yield node;
      node = (c_prt !== node ? c_prt : c_node);
    }

    while(node !== null) {
      // decrease_key(node)
      const new_level = Math.min(
        AATree.get_level(node.left),
        AATree.get_level(node.right)
      ) + 1;
      if(new_level < node.level) {
        this.current_nodes = [node];
        node.level = new_level;
        if(new_level < AATree.get_level(node.right)) {
          this.current_nodes.push(node.right);
          node.right.level = new_level;
          this.update_nodes.add(node.right);
        }
        yield;
      }
      // skew(node)
      if(AATree.needToSkew(node)) {
        this.current_nodes = [node, node.left];
        this.update_nodes.add(node.left);
        node = AATree.skew(node);
        if(node.prt === null) {
          this.root = node;
        }
        yield;
      }
      // skew(node.right)
      if(AATree.needToSkew(node.right)) {
        const right = node.right;
        this.current_nodes = [right, right.left];
        this.update_nodes.add(right).add(right.left);
        AATree.skew(right);
        yield;
      }
      // skew(node.right.right)
      if(node.right !== null && AATree.needToSkew(node.right.right)) {
        const r_right = node.right.right;
        this.current_nodes = [r_right, r_right.left];
        this.update_nodes.add(r_right).add(r_right.left);
        AATree.skew(r_right);
        yield;
      }
      // split(node)
      if(AATree.needToSplit(node)) {
        this.current_nodes = [node, node.right, node.right.right];
        this.update_nodes.add(node.right).add(node.right.right);
        node = AATree.split(node);
        if(node.prt === null) {
          this.root = node;
        }
        yield;
      }
      // split(node.right)
      if(AATree.needToSplit(node.right)) {
        const right = node.right;
        this.current_nodes = [right, right.right, right.right.right];
        this.update_nodes.add(right).add(right.right).add(right.right.right);
        AATree.split(right);
        yield;
      }
      node = node.prt;
    }
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values()).filter(node => node !== null);
  }

  get_current_nodes() {
    return this.current_nodes.filter(node => node !== null);
  }
}

window.onload = () => {
  const tree = new AATree();

  const node_view = {}, node_map = {};
  let tl = null;

  const canvas = document.querySelector("svg.canvas");
  const nodes = document.querySelector(".nodes");
  const edges = document.querySelector(".edges");
  const slider = document.querySelector(".anime-slider");
  slider.oninput = ((el) => {
    if(tl !== null) {
      tl.seek(tl.duration * (slider.value / 100));
    }
  });
  let delete_n_id = null;

  const add_node = (v, node) => {
    const n_id = node.id;
    nodes.appendChild(create_node(v, n_id));
    edges.appendChild(create_edge(v, n_id));
    const d_node = document.querySelector(`g.node${n_id}`);
    const d_edge = document.querySelector(`path.edge${n_id}`);

    node_view[v] = {
      "nid": n_id,
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

  const translate_obj = (result, t_node, c_nodes) => {
    default_translate_obj(node_map, result, tl);
    const t_view = (t_node !== null ? node_view[t_node.val].node : null);
    const c_views = (c_nodes !== null ? c_nodes.map(node => node_view[node.val].node) : []);
    tl.add({
      targets: ['circle.node-circle'],
      stroke: [{value: (el) => {
        const n_id = el.parentNode.getAttribute("nid");
        const node = node_map[n_id];
        const is_red = (node.prt !== null && node.level == node.prt.level);
        return (is_red ? "#ff0000" : "#000000");
      }}],
      duration: 1000,
      changeBegin: (tl) => {
        begin_change_current_color(t_view, c_views);
      },
      changeComplete: (tl) => {
        end_change_current_color(t_view, c_views);
      },
    }, '-=1000');
  };

  const init_timeline = () => {
    if(delete_n_id !== null) {
      const n_id = delete_n_id;
      remove_node(n_id);
      remove_edge(n_id);
      delete_n_id = null;
    }
    if(tl !== null) {
      tl.seek(tl.duration);
    }
    tl = anime.timeline({
      duration: 1000,
      update: (anim) => {
        slider.value = tl.progress;
      },
    });
  };

  const remove_tree_node = (v) => {
    const node_num = Object.keys(node_view).length;

    init_timeline();

    let max_depth = traverse(tree.root).depth;

    let t_node = (node_view[v] ? node_map[node_view[v].nid] : null);
    let v_n_id = null;
    let target_node = null;

    const step = tree.remove(v);
    while(true) {
      const {done: done, value: node} = step.next();
      if(done) break;

      if(node !== undefined) {
        v_n_id = node.id;
        target_node = node_view[v].node;
        t_node = null;

        hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);
      }
      const {ps: result, depth: depth} = traverse(tree.root);
      if(t_node === null) {
        result[v_n_id] = [0, 0];
      }

      const c_nodes = tree.get_current_nodes();
      translate_obj(result, t_node, c_nodes);
      max_depth = Math.max(max_depth, depth);
    }

    if(v_n_id !== null) {
      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);
    tl.changeBegin = () => {
      begin_change_color(target_node, update_nodes);
    };
    tl.changeComplete = () => {
      end_change_color(target_node, update_nodes);
    };
    delete_n_id = v_n_id;

    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    init_timeline();

    tl.add({
      duration: 1000,
    });

    let max_depth = traverse(tree.root).depth;

    let t_node = (node_view[v] ? node_map[node_view[v].nid] : null);
    const step = tree.insert(v);
    while(true) {
      const {done: done, value: node} = step.next();
      if(done) break;

      if(node !== undefined) {
        add_node(v, node);
        t_node = node;
      }
      const {ps: result, depth: depth} = traverse(tree.root);

      const c_nodes = tree.get_current_nodes();
      translate_obj(result, t_node, c_nodes);
      max_depth = Math.max(max_depth, depth);
    }

    const target_node = node_view[v].node;

    const update_nodes = tree.get_update_nodes().map(node => node_view[node.val].node);
    tl.changeBegin = () => {
      begin_change_color(target_node, update_nodes);
    };
    tl.changeComplete = () => {
      end_change_color(target_node, update_nodes);
    };

    const node_num = Object.keys(node_view).length;
    change_canvas_size(
      (node_num+1) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const check_constraints = () => {
    let base_depth = -1;
    const leaves = [];

    const dfs = (node, prt) => {
      if(node.left === null && node.right === null) {
        if(node.level !== 1) {
          console.log("F: the level of a leaf is not one", node);
        }
        return 1;
      }
      if(node.level > 1) {
        if(node.left === null || node.right === null) {
          console.log("F: a node which is level > 2 has two children", node);
        }
      }
      if(node.left !== null) {
        if(node.left.level + 1 !== node.level) {
          console.log("F: the level of a left child", node, node, node.left);
        }
        dfs(node.left, node);
      }
      if(node.right !== null) {
        const right = node.right;
        if(right.level + 1 !== node.level && right.level !== node.level) {
          console.log("F: the level of a right child", node, node.level, right.level);
        }
        if(right.right !== null) {
          const r_right = right.right;
          if(r_right.level >= node.level) {
            console.log("F: the level of a right grandchild", node, node.level, r_right.level);
          }
        }
        dfs(node.right, node);
      }
    };
    if(tree.root !== null && tree.root.color === Node.RED) {
      console.log("F: root is red", tree.root);
    }
    if(tree.root !== null) dfs(tree.root, null, 0);
    let max_depth = 0;
    for(let [node, bdep] of leaves) {
      max_depth = Math.max(max_depth, bdep);
    }
    if(leaves.some((e) => e[1] !== max_depth)) {
      for(let [node, bdep] of leaves) {
        console.log("F: black depth", node, bdep, max_depth);
      }
    }
    console.log("checked");
  };

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_inc(add_tree_node);
  set_add_dec(add_tree_node);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
