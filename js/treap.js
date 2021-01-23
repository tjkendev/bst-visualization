"use strict";

class Node extends BaseNode {
  constructor(val) {
    super(val);
    this.priority = Math.random();
  }
}

class Treap {
  constructor() {
    this.clear();
    this.update_nodes = [];
    this.current_nodes = [];
  }

  clear() {
    this.root = null;
    this.cur = null;
  }

  insert(x) {
    this.update_nodes = [];
    this.current_nodes = [];
    if(this.root === null) {
      const new_node = new Node(x);
      this.current_nodes = [new_node];
      return (this.root = this.cur = new_node);
    }
    let node = this.root;
    while(node !== null) {
      if(node.val === x) {
        return null;
      }
      this.update_nodes.push(node);
      if(x < node.val) {
        if(node.left === null) break;
        node = node.left;
      } else {
        if(node.right === null) break;
        node = node.right;
      }
    }
    const new_node = new Node(x);
    this.current_nodes = [new_node];
    if(x < node.val) {
      node.set_left(new_node);
    } else {
      node.set_right(new_node);
    }
    return (this.cur = new_node);
  }

  insert_rotate_step() {
    if(this.cur === null) {
      return false;
    }
    const node = this.cur, prt = node.prt;
    if(prt === null || node.priority < prt.priority) {
      this.current_nodes = [];
      this.cur = null;
      return false;
    }
    this.current_nodes = [node, prt];
    if(node.val < prt.val) {
      prt.rotate_right();
    } else {
      prt.rotate_left();
    }
    if(node.prt === null) {
      this.root = node;
    }
    return true;
  }

  prepare_remove(x) {
    this.update_nodes = [];
    this.current_nodes = [];
    this.cur = null;
    if(this.root === null) {
      return null;
    }
    let node = this.root;
    while(node !== null && node.val !== x) {
      this.update_nodes.push(node);
      if(x < node.val) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    if(node === null) {
      return null;
    }
    return (this.cur = node);
  }

  remove_rotate_step() {
    if(this.cur === null) {
      this.current_nodes = [];
      return false;
    }
    const node = this.cur, prt = node.prt;
    this.current_nodes = [node, node.left, node.right];
    if(node.left === null || node.right === null) {
      const n_node = node.left || node.right;
      if(n_node !== null) this.update_nodes.push(n_node);
      if(prt !== null) {
        if(node.val < prt.val) {
          prt.set_left(n_node);
        } else {
          prt.set_right(n_node);
        }
      } else {
        node.remove_child(n_node);
        this.root = n_node;
      }
      this.cur = null;
      return false;
    }

    if(node.left.priority < node.right.priority) {
      const r = node.rotate_left();
      if(r.prt === null) {
        this.root = r;
      }
      this.update_nodes.push(r);
    } else {
      const r = node.rotate_right();
      if(r.prt === null) {
        this.root = r;
      }
      this.update_nodes.push(r);
    }
    return true;
  }

  get_update_nodes() {
    return this.update_nodes;
  }

  get_current_nodes() {
    return this.current_nodes.filter(node => node !== null);
  }
}

window.onload = () => {
  const tree = new Treap();

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
        return `rgb(${255 * node.priority}, 0, 0)`;
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
      const result = traverse(tree.root);
      max_depth = result.depth;
      translate_obj(result.ps, null, null);
    }

    let v_n_id = null;
    let target_node = null;

    const node = tree.prepare_remove(v);
    if(node !== null) {
      v_n_id = node.id;
      target_node = node_view[v].node;

      let updated = true;
      while(tree.remove_rotate_step()) {
        const result = traverse(tree.root);
        max_depth = Math.max(max_depth, result.depth);
        const c_nodes = tree.get_current_nodes();
        translate_obj(result.ps, node, c_nodes);
      }

      hide_nodes(tl, [`g.node${v_n_id}`], [`path.edge${v_n_id}`]);
      {
        const result = traverse(tree.root);
        max_depth = Math.max(max_depth, result.depth);
        result.ps[v_n_id] = [0, 0];
        const c_nodes = tree.get_current_nodes();
        translate_obj(result.ps, null, c_nodes);
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

    const result_f = traverse(tree.root);
    let max_depth = result_f.depth;
    translate_obj(result_f.ps, null, null);

    const node = tree.insert(v, true);
    if(node !== null) {
      add_node(v, node);
      let updated = true;
      while(true) {
        const result = traverse(tree.root);

        max_depth = Math.max(max_depth, result.depth);

        const c_nodes = tree.get_current_nodes();
        translate_obj(result.ps, node, c_nodes);
        if(!updated) {
          break;
        }
        updated = tree.insert_rotate_step();
      }
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

  set_add_random(add_tree_node);
  set_remove_random(remove_tree_node, node_view);
  set_add_inc(add_tree_node);
  set_add_dec(add_tree_node);
  set_add_value(add_tree_node);
  set_remove_value(remove_tree_node);
};
