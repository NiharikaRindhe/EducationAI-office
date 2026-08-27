import type { SimFile } from '../contract.js'
import { projectile_2d } from './projectile_2d.js'
import { free_fall } from './free_fall.js'
import { collision_1d } from './collision_1d.js'
import { pendulum } from './pendulum.js'
import { ramp_friction } from './ramp_friction.js'
import { buoyancy } from './buoyancy.js'
import { bounce_energy } from './bounce_energy.js'
import { force_ma } from './force_ma.js'
import { uniform_motion } from './uniform_motion.js'
import { accelerated_motion } from './accelerated_motion.js'
import { spring_shm } from './spring_shm.js'
import { circular_motion } from './circular_motion.js'
import { reflection_plane } from './reflection_plane.js'
import { snell_refraction } from './snell_refraction.js'
import { convex_lens } from './convex_lens.js'
import { ohm_circuit } from './ohm_circuit.js'
import { magnetic_wire } from './magnetic_wire.js'
import { sound_wave } from './sound_wave.js'
import { heat_conduction } from './heat_conduction.js'
import { shadow_light } from './shadow_light.js'
import { kinetic_particles } from './kinetic_particles.js'
import { states_of_matter } from './states_of_matter.js'
import { diffusion } from './diffusion.js'
import { gas_piston } from './gas_piston.js'
import { electron_shells } from './electron_shells.js'
import { ionic_bond } from './ionic_bond.js'
import { covalent_bond } from './covalent_bond.js'
import { collision_theory } from './collision_theory.js'
import { electrolysis } from './electrolysis.js'
import { number_line_walk } from './number_line_walk.js'
import { fraction_bar } from './fraction_bar.js'
import { linear_graph } from './linear_graph.js'
import { quadratic_parabola } from './quadratic_parabola.js'
import { unit_circle } from './unit_circle.js'
import { angle_of_elevation } from './angle_of_elevation.js'
import { pythagoras } from './pythagoras.js'
import { circle_unroll } from './circle_unroll.js'
import { similar_triangles } from './similar_triangles.js'
import { transform_2d } from './transform_2d.js'
import { volume_fill } from './volume_fill.js'
import { coordinate_plot } from './coordinate_plot.js'
import { st_vt_graph } from './st_vt_graph.js'
import { vi_graph } from './vi_graph.js'
import { inverse_graph } from './inverse_graph.js'
import { bar_chart } from './bar_chart.js'
import { histogram } from './histogram.js'
import { ap_graph } from './ap_graph.js'
import { angle_pair } from './angle_pair.js'
import { parallel_transversal } from './parallel_transversal.js'
import { triangle_angles } from './triangle_angles.js'
import { quadrilateral_live } from './quadrilateral_live.js'
import { circle_tangent } from './circle_tangent.js'
import { sector_segment } from './sector_segment.js'
import { section_formula } from './section_formula.js'
import { identity_tiles } from './identity_tiles.js'
import { ratio_bars } from './ratio_bars.js'
import { equation_balance } from './equation_balance.js'
import { square_grid } from './square_grid.js'
import { probability_spinner } from './probability_spinner.js'
import { clock_hands } from './clock_hands.js'
import { pressure_area } from './pressure_area.js'
import { liquid_pressure } from './liquid_pressure.js'
import { series_parallel } from './series_parallel.js'
import { heating_effect } from './heating_effect.js'
import { mirror_ray } from './mirror_ray.js'
import { prism } from './prism.js'
import { echo } from './echo.js'
import { work_fs } from './work_fs.js'
import { solenoid } from './solenoid.js'
import { separation_mix } from './separation_mix.js'
import { ph_strip } from './ph_strip.js'
import { state_change_curve } from './state_change_curve.js'
import { reactivity_swap } from './reactivity_swap.js'
import { place_value_chart } from './place_value_chart.js'
import { fraction_kit } from './fraction_kit.js'
import { turns_angle } from './turns_angle.js'
import { add_place } from './add_place.js'
import { length_units } from './length_units.js'
import { array_multiply } from './array_multiply.js'
import { tessellate_fit } from './tessellate_fit.js'
import { weight_scale } from './weight_scale.js'
import { divide_share } from './divide_share.js'
import { symmetry_spin } from './symmetry_spin.js'
import { area_grid } from './area_grid.js'
import { race_clock } from './race_clock.js'
import { animal_jumps } from './animal_jumps.js'
import { map_compass } from './map_compass.js'
import { picture_data } from './picture_data.js'
import { water_cycle } from './water_cycle.js'
import { freshwater_share } from './freshwater_share.js'
import { river_dam } from './river_dam.js'
import { food_microbes } from './food_microbes.js'
import { kitchen_energy } from './kitchen_energy.js'
import { weave_pattern } from './weave_pattern.js'
import { earth_day_night } from './earth_day_night.js'
import { capacity_jugs } from './capacity_jugs.js'
import { lakh_crore_chart } from './lakh_crore_chart.js'
import { arith_expression } from './arith_expression.js'
import { decimal_ruler } from './decimal_ruler.js'
import { letter_number } from './letter_number.js'
import { intersecting_angles } from './intersecting_angles.js'
import { triangle_build } from './triangle_build.js'
import { fraction_multiply } from './fraction_multiply.js'
import { congruence_sas } from './congruence_sas.js'
import { integer_ops } from './integer_ops.js'
import { hcf_tiles } from './hcf_tiles.js'
import { decimal_ops } from './decimal_ops.js'
import { stat_picture } from './stat_picture.js'
import { perp_bisector } from './perp_bisector.js'
import { pan_unknown } from './pan_unknown.js'
import { litmus_lab } from './litmus_lab.js'
import { simple_circuit } from './simple_circuit.js'
import { metal_traits } from './metal_traits.js'
import { change_kind } from './change_kind.js'
import { heat_three_ways } from './heat_three_ways.js'
import { sprint_speed } from './sprint_speed.js'
import { digest_path } from './digest_path.js'
import { leaf_food } from './leaf_food.js'
import { light_path } from './light_path.js'
import { earth_spin_moon } from './earth_spin_moon.js'
import { locker_squares } from './locker_squares.js'
import { paper_fold } from './paper_fold.js'
import { rect_diagonals } from './rect_diagonals.js'
import { distribute_grid } from './distribute_grid.js'
import { similar_rect } from './similar_rect.js'
import { percent_bar } from './percent_bar.js'
import { baudhayana_square } from './baudhayana_square.js'
import { ratio_scale } from './ratio_scale.js'
import { sierpinski_step } from './sierpinski_step.js'
import { mean_balance } from './mean_balance.js'
import { think_number } from './think_number.js'
import { rect_area } from './rect_area.js'
import { water_lens } from './water_lens.js'
import { electromagnet_nail } from './electromagnet_nail.js'
import { push_pull_box } from './push_pull_box.js'
import { bag_straps } from './bag_straps.js'
import { chalk_bits } from './chalk_bits.js'
import { mix_kinds } from './mix_kinds.js'
import { dissolve_ors } from './dissolve_ors.js'
import { spoon_mirror } from './spoon_mirror.js'
import { moon_month } from './moon_month.js'
import { seq_pictures } from './seq_pictures.js'
import { line_ray_segment } from './line_ray_segment.js'
import { tally_bars } from './tally_bars.js'
import { idli_vada } from './idli_vada.js'
import { peri_rect } from './peri_rect.js'
import { roti_share } from './roti_share.js'
import { compass_circle } from './compass_circle.js'
import { fold_turn_sym } from './fold_turn_sym.js'
import { fun_lift } from './fun_lift.js'
import { plant_group } from './plant_group.js'
import { stick_magnet } from './stick_magnet.js'
import { handspan_metre } from './handspan_metre.js'
import { material_sort } from './material_sort.js'
import { three_bowls } from './three_bowls.js'
import { water_three } from './water_three.js'
import { everyday_separate } from './everyday_separate.js'
import { living_or_not } from './living_or_not.js'
import { star_pattern } from './star_pattern.js'
import { four_quadrant } from './four_quadrant.js'
import { coord_distance } from './coord_distance.js'
import { linear_poly } from './linear_poly.js'
import { wire_area } from './wire_area.js'
import { sqrt2_line } from './sqrt2_line.js'
import { ab_square } from './ab_square.js'
import { circle_chord } from './circle_chord.js'
import { track_stagger } from './track_stagger.js'
import { heron_area } from './heron_area.js'
import { maybe_chance } from './maybe_chance.js'
import { dot_sequence } from './dot_sequence.js'
import { ap_gp_steps } from './ap_gp_steps.js'
import { cricket_model } from './cricket_model.js'
import { cell_parts } from './cell_parts.js'
import { xylem_phloem } from './xylem_phloem.js'
import { joint_kinds } from './joint_kinds.js'
import { dist_displace } from './dist_displace.js'
import { motion_graphs } from './motion_graphs.js'
import { mix_three } from './mix_three.js'
import { box_newton } from './box_newton.js'
import { lift_work } from './lift_work.js'
import { machine_help } from './machine_help.js'
import { gold_foil } from './gold_foil.js'
import { keep_mass } from './keep_mass.js'
import { bond_kind } from './bond_kind.js'
import { sound_echo } from './sound_echo.js'
import { one_parent } from './one_parent.js'
import { five_kingdoms } from './five_kingdoms.js'
import { five_spheres } from './five_spheres.js'
import { prime_share } from './prime_share.js'
import { poly_zeroes } from './poly_zeroes.js'
import { pair_lines } from './pair_lines.js'
import { root_nature } from './root_nature.js'
import { ap_rungs } from './ap_rungs.js'
import { thales_cut } from './thales_cut.js'
import { like_triangles } from './like_triangles.js'
import { coord_gap } from './coord_gap.js'
import { section_split } from './section_split.js'
import { right_trig } from './right_trig.js'
import { tower_sight } from './tower_sight.js'
import { circle_touch } from './circle_touch.js'
import { slice_area } from './slice_area.js'
import { combo_solid } from './combo_solid.js'
import { group_avg } from './group_avg.js'
import { fair_chance } from './fair_chance.js'
import { react_kind } from './react_kind.js'
import { acid_strip } from './acid_strip.js'
import { metal_swap } from './metal_swap.js'
import { carbon_share } from './carbon_share.js'
import { curve_mirror } from './curve_mirror.js'
import { glass_slab } from './glass_slab.js'
import { bend_lens } from './bend_lens.js'
import { eye_see } from './eye_see.js'
import { prism_split } from './prism_split.js'
import { ohm_line } from './ohm_line.js'
import { two_resist } from './two_resist.js'
import { heat_wire } from './heat_wire.js'
import { field_wire } from './field_wire.js'
import { plant_food } from './plant_food.js'
import { gut_tube } from './gut_tube.js'
import { breath_kind } from './breath_kind.js'
import { blood_loop } from './blood_loop.js'
import { nerve_path } from './nerve_path.js'
import { plant_bend } from './plant_bend.js'
import { split_grow } from './split_grow.js'
import { flower_parts } from './flower_parts.js'
import { pea_cross } from './pea_cross.js'
import { food_rung } from './food_rung.js'
import { rotate_arms } from './rotate_arms.js'
import { flower_beds } from './flower_beds.js'
import { kind_of_move } from './kind_of_move.js'
import { two_lenses } from './two_lenses.js'
import { wind_spin } from './wind_spin.js'
import { india_seasons } from './india_seasons.js'

export const SIM_REGISTRY = {
  projectile_2d,
  free_fall,
  collision_1d,
  pendulum,
  ramp_friction,
  buoyancy,
  bounce_energy,
  force_ma,
  uniform_motion,
  accelerated_motion,
  spring_shm,
  circular_motion,
  reflection_plane,
  snell_refraction,
  convex_lens,
  ohm_circuit,
  magnetic_wire,
  sound_wave,
  heat_conduction,
  shadow_light,
  kinetic_particles,
  states_of_matter,
  diffusion,
  gas_piston,
  electron_shells,
  ionic_bond,
  covalent_bond,
  collision_theory,
  electrolysis,
  number_line_walk,
  fraction_bar,
  linear_graph,
  quadratic_parabola,
  unit_circle,
  angle_of_elevation,
  pythagoras,
  circle_unroll,
  similar_triangles,
  transform_2d,
  volume_fill,
  coordinate_plot,
  st_vt_graph,
  vi_graph,
  inverse_graph,
  bar_chart,
  histogram,
  ap_graph,
  angle_pair,
  parallel_transversal,
  triangle_angles,
  quadrilateral_live,
  circle_tangent,
  sector_segment,
  section_formula,
  identity_tiles,
  ratio_bars,
  equation_balance,
  square_grid,
  probability_spinner,
  clock_hands,
  pressure_area,
  liquid_pressure,
  series_parallel,
  heating_effect,
  mirror_ray,
  prism,
  echo,
  work_fs,
  solenoid,
  separation_mix,
  ph_strip,
  state_change_curve,
  reactivity_swap,
  place_value_chart,
  fraction_kit,
  turns_angle,
  add_place,
  length_units,
  array_multiply,
  tessellate_fit,
  weight_scale,
  divide_share,
  symmetry_spin,
  area_grid,
  race_clock,
  animal_jumps,
  map_compass,
  picture_data,
  water_cycle,
  freshwater_share,
  river_dam,
  food_microbes,
  kitchen_energy,
  weave_pattern,
  earth_day_night,
  capacity_jugs,
  lakh_crore_chart,
  arith_expression,
  decimal_ruler,
  letter_number,
  intersecting_angles,
  triangle_build,
  fraction_multiply,
  congruence_sas,
  integer_ops,
  hcf_tiles,
  decimal_ops,
  stat_picture,
  perp_bisector,
  pan_unknown,
  litmus_lab,
  simple_circuit,
  metal_traits,
  change_kind,
  heat_three_ways,
  sprint_speed,
  digest_path,
  leaf_food,
  light_path,
  earth_spin_moon,
  locker_squares,
  paper_fold,
  rect_diagonals,
  distribute_grid,
  similar_rect,
  percent_bar,
  baudhayana_square,
  ratio_scale,
  sierpinski_step,
  mean_balance,
  think_number,
  rect_area,
  water_lens,
  electromagnet_nail,
  push_pull_box,
  bag_straps,
  chalk_bits,
  mix_kinds,
  dissolve_ors,
  spoon_mirror,
  moon_month,
  seq_pictures,
  line_ray_segment,
  tally_bars,
  idli_vada,
  peri_rect,
  roti_share,
  compass_circle,
  fold_turn_sym,
  fun_lift,
  plant_group,
  stick_magnet,
  handspan_metre,
  material_sort,
  three_bowls,
  water_three,
  everyday_separate,
  living_or_not,
  star_pattern,
  four_quadrant,
  coord_distance,
  linear_poly,
  wire_area,
  sqrt2_line,
  ab_square,
  circle_chord,
  track_stagger,
  heron_area,
  maybe_chance,
  dot_sequence,
  ap_gp_steps,
  cricket_model,
  cell_parts,
  xylem_phloem,
  joint_kinds,
  dist_displace,
  motion_graphs,
  mix_three,
  box_newton,
  lift_work,
  machine_help,
  gold_foil,
  keep_mass,
  bond_kind,
  sound_echo,
  one_parent,
  five_kingdoms,
  five_spheres,
  prime_share,
  poly_zeroes,
  pair_lines,
  root_nature,
  ap_rungs,
  thales_cut,
  like_triangles,
  coord_gap,
  section_split,
  right_trig,
  tower_sight,
  circle_touch,
  slice_area,
  combo_solid,
  group_avg,
  fair_chance,
  react_kind,
  acid_strip,
  metal_swap,
  carbon_share,
  curve_mirror,
  glass_slab,
  bend_lens,
  eye_see,
  prism_split,
  ohm_line,
  two_resist,
  heat_wire,
  field_wire,
  plant_food,
  gut_tube,
  breath_kind,
  blood_loop,
  nerve_path,
  plant_bend,
  split_grow,
  flower_parts,
  pea_cross,
  food_rung,
  rotate_arms,
  flower_beds,
  kind_of_move,
  two_lenses,
  wind_spin,
  india_seasons,
} as const satisfies Record<string, SimFile>

export type TemplateId = keyof typeof SIM_REGISTRY

export const TEMPLATE_IDS = Object.keys(SIM_REGISTRY) as TemplateId[]

export function getSim(id: TemplateId): SimFile {
  return SIM_REGISTRY[id]
}

export function runSim(id: TemplateId, params: Record<string, number>) {
  return SIM_REGISTRY[id].run(params)
}
