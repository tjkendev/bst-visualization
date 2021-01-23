"use strict";

function is_black(node) {
  return (node === null) || (node.color === Node.BLACK);
}

function is_red(node) {
  return !is_black(node);
}

class Node extends BaseNode {
  constructor(val) {
    super(val);
    // 0 = black, 1 = red
    this.color = Node.RED;
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

class BottomUpRedBlackTree {
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

  insert(x) {
    this.update_nodes = new Set();
    this.current_nodes = [];
    if(this.root === null) {
      this.cur = this.root = new Node(x);
      this.current_nodes = [this.root];
      return this.root;
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

    if(x === node.val) {
      return (this.cur = null);
    }

    const new_node = new Node(x);
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    this.cur = new_node;
    this.current_nodes = [new_node];
    return new_node;
  }

  remove(x) {
    this.update_nodes = new Set();
    this.current_nodes = [];
    this.cur = this.prt = null;
    this.dnode = null;
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
        this.cur = n_node;
      }
      this.dnode_color = node.color;
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
      this.dnode_color = c_node.color;
      c_node.color = node.color;
    }
    return node;
  }

  *insert_rebalancing() {
    if(this.cur === null) {
      return;
    }
    let node = this.cur;
    while(true) {
      let prt = node.prt;
      if(prt === null) {
        // Case 1
        if(is_red(node)) {
          this.current_nodes = [node];
          node.color = Node.BLACK;
          yield;
        }
        break;
      }
      if(is_black(prt)) {
        // Case 2: do nothing
        break;
      }
      const gprt = prt.prt;
      // assert (prt.color === 1 && gprt !== null)
      const u = gprt.get_sib(prt);
      this.update_nodes.add(u);
      if(is_black(u)) {
        // Case 4, Step 1
        this.current_nodes = [gprt, prt, node];
        if(gprt.is_left(prt) && prt.is_right(node)) {
          prt = prt.rotate_left();
          node = prt.left;
          yield;
        } else if(gprt.is_right(prt) && prt.is_left(node)) {
          prt = prt.rotate_right();
          node = prt.right;
          yield;
        }

        // Case 4, Step 2
        this.current_nodes = [gprt, prt];
        if(prt.is_left(node)) {
          const r = gprt.rotate_right();
          if(r.prt === null) this.root = r;
        } else {
          const r = gprt.rotate_left();
          if(r.prt === null) this.root = r;
        }
        yield;

        prt.color = Node.BLACK;
        gprt.color = Node.RED;
        yield;

        break;
      }

      // Case 3
      this.current_nodes = [u, prt, gprt];
      prt.color = Node.BLACK;
      gprt.color = Node.RED;
      u.color = Node.BLACK;

      yield;
      node = gprt;
    }
    this.current_nodes = [];
  }

  *remove_rebalancing() {
    if(this.dnode_color === Node.RED) {
      return;
    }
    if(is_red(this.cur)) {
      this.cur.color = Node.BLACK;
      this.update_nodes.add(this.cur);
      this.current_nodes = [this.cur];
      yield;
      return;
    }

    let node = this.cur, prt = this.prt;
    while(true) {
      // Case 1
      if(prt === null) {
        break;
      }
      let sib = prt.get_sib(node);
      this.update_nodes.add(sib);

      // Case 2
      // assert (sib !== null)
      if(is_red(sib)) {
        this.current_nodes = [node, prt, sib, sib.left, sib.right];
        this.update_nodes.add(sib.left).add(sib.right);
        const r = (prt.is_left(node) ? prt.rotate_left() : prt.rotate_right());
        if(r.prt === null) this.root = r;
        yield;

        prt.color = Node.RED;
        sib.color = Node.BLACK;

        sib = prt.get_sib(node);
        yield;
      }

      if([prt, sib, sib.left, sib.right].some(is_red)) {
        // Case 4
        if(is_red(prt) && [sib, sib.left, sib.right].every(is_black)) {
          this.current_nodes = [node, prt, sib, sib.left, sib.right];
          this.update_nodes.add(sib.left).add(sib.right);
          sib.color = Node.RED;
          prt.color = Node.BLACK;
          yield;
          break;
        }

        if(is_black(sib)) {
          // Case 5
          if(prt.is_left(node) && is_black(sib.right) && is_red(sib.left)) {
            this.current_nodes = [sib, sib.left, sib.right];
            this.update_nodes.add(sib.left).add(sib.right);
            const r = sib.rotate_right();
            yield;

            r.color = Node.RED;
            r.right.color = Node.BLACK;
          } else if(prt.is_right(node) && is_black(sib.left) && is_red(sib.right)) {
            this.current_nodes = [sib, sib.left, sib.right];
            this.update_nodes.add(sib.left).add(sib.right);
            const r = sib.rotate_left();
            yield;

            r.color = Node.RED;
            r.left.color = Node.BLACK;
          }
          sib = prt.get_sib(node);
          yield;
        }

        // Case 6
        if(prt.is_left(node)) {
          this.current_nodes = [node, prt, sib, sib.right];
          this.update_nodes.add(sib.left).add(sib.right);
          const r = prt.rotate_left();
          if(r.prt === null) this.root = r;
          yield;

          sib.color = prt.color;
          prt.color = sib.right.color = Node.BLACK;
          this.update_nodes.add(sib.right);
          yield;
        } else {
          this.current_nodes = [node, prt, sib, sib.left];
          this.update_nodes.add(sib.left).add(sib.right);
          const r = prt.rotate_right();
          if(r.prt === null) this.root = r;
          yield;

          sib.color = prt.color;
          prt.color = sib.left.color = Node.BLACK;
          this.update_nodes.add(sib.left);
          yield;
        }
        break;
      }

      // Case 3
      this.current_nodes = [node, prt, sib, sib.left, sib.right];
      this.update_nodes.add(sib.left).add(sib.right);
      sib.color = Node.RED;
      yield;

      node = prt;
      prt = prt && prt.prt;
    }
    this.current_nodes = [];
  }

  get_update_nodes() {
    return Array.from(this.update_nodes.values()).filter(node => node !== null);
  }

  get_current_nodes() {
    return this.current_nodes.filter(node => node !== null);
  }
}

window.onload = () => {
  const tree = new BottomUpRedBlackTree();

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
      "node": d_node,
      "edge": d_edge,
    };
    node_map[n_id] = node;
  };

  const change_canvas_size = (width, height) => {
    default_change_canvas_size(canvas, width, height);
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
        return (node.color === Node.RED ? "#ff0000" : "#000000");
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

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      translate_obj(result_m.ps, null, null);
      max_depth = result_m.depth;
    }

    let v_n_id = null;
    let target_node = null;

    const node = tree.remove(v);
    if(node !== null) {
      v_n_id = node.id;
      target_node = node_view[v].node;

      hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);

      let updated = true;
      const step = tree.remove_rebalancing();
      while(true) {
        const result_m = traverse(tree.root);
        const result = result_m.ps;
        const c_nodes = tree.get_current_nodes();
        result[v_n_id] = [0, 0];
        max_depth = Math.max(max_depth, result_m.depth);
        translate_obj(result, node, c_nodes);

        if(!updated) break;
        updated = !step.next().done;
      }

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

    const node = tree.insert(v);
    if(node !== null && !node_map[node.id]) {
      add_node(v, node);
    }

    let max_depth = 0;
    {
      const result_m = traverse(tree.root);
      translate_obj(result_m.ps, null, null);
      max_depth = result_m.depth;
    }

    const step = tree.insert_rebalancing();
    while(!step.next().done) {
      const result_m = traverse(tree.root);

      const c_nodes = tree.get_current_nodes();
      translate_obj(result_m.ps, node, c_nodes);
      max_depth = Math.max(max_depth, result_m.depth);
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

    const dfs = (node, prt, bdep) => {
      if(node === null) {
        if(prt) leaves.push([prt, bdep+1]);
        return;
      }
      if(node.color === 0) {
        ++bdep;
      }
      dfs(node.left, node, bdep);
      if(is_red(node) && is_red(prt)) {
        console.log("F: red and red", node, prt);
      }
      dfs(node.right, node, bdep);
    };
    if(tree.root !== null && tree.root.color === Node.RED) {
      console.log("F: root is red", tree.root);
    }
    dfs(tree.root, null, 0);
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
