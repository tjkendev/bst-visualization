"use strict";

class Node extends BaseNode {
  constructor(val) {
    super(val);
    this.rank = 0;
  }

  rdiff() {
    const prt = this.prt;
    return (prt !== null ? (prt.rank - this.rank) : 0);
  }

  promote(v = 1) {
    this.rank += v;
  }

  demote(v = 1) {
    this.rank -= v;
  }

  get_sib(node) {
    return (this.is_left(node) ? this.right : this.left);
  }
}

class WAVLTree {
  constructor() {
    this.root = null;
    this.update_nodes = new Set();
    this.current_nodes = [];
  }

  static rdiff(prt, node) {
    if(prt === null) {
      return 0;
    }
    return (node !== null ? node.rdiff() : prt.rank + 1);
  }

  *insert(x) {
    this.update_nodes = new Set();
    if(this.root === null) {
      this.root = new Node(x)
      this.current_nodes = [this.root];
      yield this.root;
      return;
    }
    let node = this.root;
    while(node !== null) {
      if(node.val === x) {
        break;
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
    if(node.val === x) {
      return;
    }

    const new_node = new Node(x);
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    this.current_nodes = [new_node];
    yield new_node;

    node = new_node;
    while(node.prt !== null) {
      const prt = node.prt;
      const ld = WAVLTree.rdiff(prt, prt.left);
      const rd = WAVLTree.rdiff(prt, prt.right);
      if(!((ld === 0 && rd === 1) || (ld === 1 && rd === 0))) {
        break;
      }
      // Promote
      prt.promote();
      node = prt;
      this.current_nodes = [prt];
      yield;
    }

    if(node.prt === null || node.rdiff() !== 0) {
      return;
    }

    {
      const prt = node.prt;
      if(prt.is_left(node)) {
        const right = node.right;
        if(right === null || right.rdiff() === 2) {
          // Rotate
          prt.rotate_right();
          if(node.prt === null) {
            this.root = node;
          }
          prt.demote();
          this.current_nodes = [node, prt];
          yield;
        } else {
          // Double Rotate
          node.rotate_left();
          const r = prt.rotate_right();
          if(r.prt === null) {
            this.root = r;
          }
          right.promote();
          prt.demote();
          node.demote();
          this.update_nodes.add(right);
          this.current_nodes = [node, prt, right];
          yield;
        }
      } else {
        const left = node.left;
        if(left === null || left.rdiff() === 2) {
          // Rotate
          prt.rotate_left();
          if(node.prt === null) {
            this.root = node;
          }
          prt.demote();
          this.current_nodes = [node, prt];
          yield;
        } else {
          // Double Rotate
          node.rotate_right();
          const r = prt.rotate_left();
          if(r.prt === null) {
            this.root = r;
          }
          left.promote();
          prt.demote();
          node.demote();
          this.update_nodes.add(left);
          this.current_nodes = [node, prt, left];
          yield;
        }
      }
    }
    return;
  }

  *remove(x) {
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

    let prt = node.prt;
    if(node.left === null || node.right === null) {
      const n_node = node.left || node.right;
      if(prt !== null) {
        if(x < prt.val) {
          prt.set_left(n_node);
        } else {
          prt.set_right(n_node);
        }
        this.current_nodes = [node];
        yield node;
        // prt = prt;
        node = n_node;
      } else {
        node.remove_child(n_node);
        this.root = n_node;
        this.current_nodes = [node];
        yield node;
        node = prt = null;
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
      c_node.rank = node.rank;
      this.current_nodes = [node];
      yield node;

      if(is_child) {
        prt = c_node;
        node = c_node.right;
      } else {
        prt = c_prt;
        node = c_prt.left;
      }
    }

    if(prt === null) {
      return;
    }

    if(prt !== null && prt.left === null && prt.right === null && prt.rank === 1) {
      // 2,2-leaf
      prt.demote();

      this.current_nodes = [prt];
      yield;
      if(prt.rdiff() <= 2) {
        return;
      }
      node = prt;
      prt = node.prt;
    }

    while(WAVLTree.rdiff(prt, node) === 3) {
      const sib = prt.get_sib(node);
      if(sib === null) {
        if(WAVLTree.rdiff(prt, sib) !== 2) {
          break;
        }
        prt.demote();
        this.current_nodes = [prt];
        yield;
      } else {
        const ld = WAVLTree.rdiff(sib, sib.left);
        const rd = WAVLTree.rdiff(sib, sib.right);
        if(sib.rdiff() !== 2 && !(ld === 2 && rd === 2)) {
          break;
        }
        if(sib.rdiff() === 2) {
          prt.demote();
          this.current_nodes = [prt];
        } else {
          prt.demote();
          sib.demote();
          this.current_nodes = [prt, sib];
          this.update_nodes.add(sib);
        }
        yield;
      }
      node = prt;
      prt = node.prt;
    }

    if(WAVLTree.rdiff(prt, node) === 3) {
      if(prt.is_left(node)) {
        const sib = prt.right;
        const s_right = sib.right;
        this.update_nodes.add(sib);
        if(WAVLTree.rdiff(sib, s_right) === 1) {
          // Rotate
          const r = prt.rotate_left();
          if(r.prt === null) {
            this.root = r;
          }
          prt.demote();
          sib.promote();
          if(prt.left === null && prt.right === null) {
            prt.demote();
          }
          this.current_nodes = [prt, sib];
          yield;
        } else { // (s_right.rdiff() === 2)
          // Double Rotate
          const s_left = sib.left;
          sib.rotate_right();
          prt.rotate_left();
          if(s_left.prt === null) {
            this.root = s_left;
          }
          prt.demote(2);
          s_left.promote(2);
          sib.demote();
          this.update_nodes.add(s_left);
          this.current_nodes = [prt, s_left, sib];
          yield;
        }
      } else {
        const sib = prt.left;
        const s_left = sib.left;
        this.update_nodes.add(sib);
        if(WAVLTree.rdiff(sib, s_left) === 1) {
          // Rotate
          const r = prt.rotate_right();
          if(r.prt === null) {
            this.root = r;
          }
          prt.demote();
          sib.promote();
          if(prt.left === null && prt.right === null) {
            prt.demote();
          }
          this.current_nodes = [prt, sib];
          yield;
        } else { // (s_left.rdiff() === 2)
          // Double Rotate
          const s_right = sib.right;
          sib.rotate_left();
          prt.rotate_right();
          if(s_right.prt === null) {
            this.root = s_right;
          }
          prt.demote(2);
          s_right.promote(2);
          sib.demote();
          this.update_nodes.add(s_right);
          this.current_nodes = [prt, s_right, sib];
          yield;
        }
      }
    }
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values());
  }

  get_current_nodes() {
    return this.current_nodes.filter(node => node !== null);
  }
}

window.onload = () => {
  const tree = new WAVLTree();

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

  const translate_obj = (result, t_node, c_nodes) => {
    default_translate_obj(node_map, result, tl);
    const t_view = (t_node !== null ? node_view[t_node.val].node : null);
    const c_views = c_nodes.map(node => node_view[node.val].node);
    tl.add({
      targets: ['circle.node-circle'],
      stroke: [{value: (el) => {
        const n_id = el.parentNode.getAttribute("nid");
        const node = node_map[n_id];
        switch(node.rdiff()) {
        case 0:
          return "#000000";
        case 1:
          return "#800000";
        case 2:
          return "#ff0000";
        case 3:
          return "#ffa500";
        default:
          return "#0000ff";
        }
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

  const change_canvas_size = (width, height) => {
    const style = canvas.style;
    style["width"] = `${width}px`;
    style["height"] = `${height}px`;
  };

  const check_constraints = () => {
    let ok = true;
    const dfs = (node) => {
      const left = node.left, right = node.right;
      // the rank difference of a node is 1 or 2
      // (the rank of a NIL-node is -1)
      if(left === null && right === null) {
        // the rank of a leaf is zero
        if(node.rank !== 0) {
          console.log(`F: leaf's rank is not zero (${node.rank}, ${node.val})`);
          ok = false;
        }
        return;
      }
      const dl = node.rank - (left ? left.rank : -1);
      const vl = (left ? left.val : -1);
      if(dl < 1 || 2 < dl) {
        console.log(`F: rank difference is ${dl} (${node.val} -> ${vl})`);
        ok = false;
      }
      const dr = node.rank - (right ? right.rank : -1);
      const vr = (right ? right.val : -1);
      if(dr < 1 || 2 < dr) {
        console.log(`F: rank difference is ${dr} (${node.val} -> ${vr})`);
        ok = false;
      }
      if(left) dfs(left);
      if(right) dfs(right);
    };
    if(tree.root) dfs(tree.root);
    console.log("checked");
    return ok;
  };

  const init_timeline = () => {
    if(delete_n_id !== null) {
      const n_id = delete_n_id;
      removeNode(n_id);
      removeEdge(n_id);
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

    let max_depth = traverse(tree.root).ps;
    tl.add({ duration: 500 });

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
        hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);
        t_node = null;
      }
      const {ps: result, depth: depth} = traverse(tree.root);

      if(v_n_id !== null) {
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

    tl.add({ duration: 500 });

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

    tl.add({ duration: 500 });

    let max_depth = traverse(tree.root).depth;
    let t_node = null;

    const step = tree.insert(v);
    while(true) {
      const {done: done, value: node} = step.next();
      if(done) break;

      if(node !== undefined) {
        add_node(v, node);
        t_node = node;
      }

      const {ps: ps, depth: depth} = traverse(tree.root);
      const c_nodes = tree.get_current_nodes();
      translate_obj(ps, t_node, c_nodes);
      max_depth = Math.max(max_depth, depth);
    }

    tl.add({ duration: 500 });

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

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_inc(add_tree_node);
  set_add_dec(add_tree_node);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
