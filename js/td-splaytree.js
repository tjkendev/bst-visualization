"use strict";

class Node extends BaseNode {
  constructor(val) {
    super(val);
  }
}

class TopDownSplayTree {
  constructor() {
    this.root = null;
    this.left = this.left_c = null;
    this.right = this.right_c = null;
    this.clear();
  }
  clear() {
    this.pv = null;
    this.update_nodes = [];
    this.current_nodes = [];
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
      this.root = new Node(x);
      this.current_nodes = [this.root];
      return this.root;
    }
    if(root.val === x) {
      this.current_nodes = [];
      return null;
    }
    const new_node = new Node(x);
    if(x < root.val) {
      this.current_nodes = [new_node, root.left, root];
      new_node.set_left(root.left);
      new_node.set_right(root);
    } else {
      this.current_nodes = [new_node, root.right, root];
      new_node.set_right(root.right);
      new_node.set_left(root);
    }
    this.root = new_node;
    return new_node;
  }

  build() {
    // assert (this.root !== null)
    const root = this.root;
    this.current_nodes = [root, this.left_c, this.right_c, this.left, this.right];
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
  get_current_nodes() {
    return this.current_nodes.filter(node => node !== null);
  }

  splaying_step() {
    let x = this.root;
    this.current_nodes = [];
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
        this.current_nodes.push(x);
        x.rotate_right();
        this.update_nodes.push(y);
        if(y.left === null) {
          this.current_nodes.push(y);
          this.root = y;
          return true;
        }
        x = y;
      }
      // zig-zig (second rotation) or zig-zag (simplified)
      const l = x.remove_left();
      this.current_nodes.push(l, x);
      this.root = l;

      this.add_right(x);
    } else {
      const y = x.right;
      if(y === null) return this.build();

      if(y.val < this.pv) {
        // zig-zig (first rotation)
        this.current_nodes.push(x);
        x.rotate_left();
        this.update_nodes.push(y);
        if(y.right === null) {
          this.current_nodes.push(y);
          this.root = y;
          return true;
        }
        x = y;
      }
      // zig-zig (second rotation) or zig-zag (simplified)
      const r = x.remove_right();
      this.current_nodes.push(r, x);
      this.root = r;

      this.add_left(x);
    }
    return true;
  }
  splaying(v) {
    this.splaying_setup(v);
    while(this.splaying_step());
  }
}

window.onload = () => {
  const tree = new TopDownSplayTree();

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

  const splaying = (tl, tree, v, need_to_add) => {
    let max_depth = 0;

    let t_node = (node_view[v] ? node_map[node_view[v].nid] : null);

    tree.clear();

    let updated = true;
    while(true) {
      const result = {};
      const result_l = traverse(tree.left);
      const result_m = traverse(tree.root);
      const result_r = traverse(tree.right);

      max_depth = Math.max(max_depth, result_l.depth, result_m.depth, result_r.depth);

      let cursor = 0;
      for(let n_id in result_l.ps) {
        const [x, y] = result_l.ps[n_id];
        result[n_id] = [x, y + 1];
      }
      cursor += Object.keys(result_l.ps).length + 2;

      for(let n_id in result_m.ps) {
        const [x, y] = result_m.ps[n_id];
        result[n_id] = [cursor + x, y];
      }
      cursor += Object.keys(result_m.ps).length + 2;

      for(let n_id in result_r.ps) {
        const [x, y] = result_r.ps[n_id];
        result[n_id] = [cursor + x, y + 1];
      }
      const c_nodes = tree.get_current_nodes();
      translate_obj(result, t_node, c_nodes);

      if(!updated) break;
      if(tree.is_splaying()) {
        if(!tree.splaying_step()) {
          if(need_to_add) {
            const node = tree.insert(v);
            if(node !== null) {
              add_node(v, node);
              t_node = node;
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
  };

  const remove_tree_node = (v) => {
    const node_num = Object.keys(node_view).length;

    init_timeline();

    let max_depth = splaying(tl, tree, v, false);

    const updates = [];
    updates.push(...tree.get_update_nodes());

    const node = tree.root;
    let v_n_id = null;
    let target_node = null;

    if(node.val === v) {
      const left = node.remove_left(), right = node.remove_right();

      const result_l = traverse(left);

      v_n_id = node.id;
      target_node = node_view[v].node;

      hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);

      if(right !== null) {
        tree.root = right;

        if(right.left !== null) {
          let updated = true;
          while(true) {
            const result = {};
            const result_m = traverse(tree.root);
            const result_r = traverse(tree.right);
            max_depth = Math.max(max_depth, result_m.depth, result_r.depth);

            let cursor = 0;
            for(let n_id in result_l.ps) {
              const [x, y] = result_l.ps[n_id];
              result[n_id] = [x, y + 1];
            }
            cursor += Object.keys(result_l.ps).length + 2;

            result[v_n_id] = [cursor, 0];
            cursor += 2;
            for(let n_id in result_m.ps) {
              const [x, y] = result_m.ps[n_id];
              result[n_id] = [cursor + x, y + 1];
            }
            cursor += Object.keys(result_m.ps).length + 2;

            for(let n_id in result_r.ps) {
              const [x, y] = result_r.ps[n_id];
              result[n_id] = [cursor + x, y + 2];
            }
            const c_nodes = tree.get_current_nodes();
            translate_obj(result, null, c_nodes);

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
          const result = {};
          for(let n_id in result_m.ps) {
            const [x, y] = result_m.ps[n_id];
            result[n_id] = [x + 2, y];
          }
          max_depth = Math.max(max_depth, result_m.depth);

          result[v_n_id] = [0, 0];
          const c_nodes = tree.get_current_nodes();
          translate_obj(result, null, c_nodes);
        }
        updates.push(...tree.get_update_nodes());
      } else {
        tree.root = left;
        if(left !== null) {
          const result_m = traverse(tree.root);
          const result = {};
          for(let n_id in result_m.ps) {
            const [x, y] = result_m.ps[n_id];
            result[n_id] = [x + 2, y];
          }
          max_depth = Math.max(max_depth, result_m.depth);
          result[v_n_id] = [0, 0];
          const c_nodes = tree.get_current_nodes();
          translate_obj(result, null, c_nodes);
        }
      }

      delete node_view[v];
      delete node_map[v_n_id];
    }

    const update_nodes = updates.map(node => node_view[node.val].node);
    tl.changeBegin = () => {
      begin_change_color(target_node, update_nodes);
    };
    tl.changeComplete = () => {
      end_change_color(target_node, update_nodes);
    };
    delete_n_id = v_n_id;

    change_canvas_size(
      (node_num+5) * NODE_W + BASE_X*2,
      (max_depth+1) * NODE_H + BASE_Y*2
    );
  };

  const add_tree_node = (v) => {
    init_timeline();

    const max_depth = splaying(tl, tree, v, true);

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
      (node_num+5) * NODE_W + BASE_X*2,
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
