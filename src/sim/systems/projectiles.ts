import type { SimContext } from '../context';
import { poseAt } from '../path';
import { TICK_RATE } from '../time';
import type { Enemy, Projectile, SimEvent, SimState } from '../types';

/**
 * Moves projectiles toward their target (or its last known position) and resolves hits:
 * a single-target hit damages only its target; a splash hit damages every enemy in the radius.
 */
export function moveProjectiles(state: SimState, ctx: SimContext, events: SimEvent[]): void {
  state.projectiles = state.projectiles.filter((projectile) => {
    const target = state.enemies.find((e) => e.id === projectile.targetId);
    if (target) {
      const pose = poseAt(ctx.path, target.pathT);
      projectile.destination = { x: pose.x, y: pose.y };
    } else {
      projectile.targetId = null;
    }

    const def = ctx.units.towers[projectile.kind]!;
    const step = def.projectileSpeed / TICK_RATE;
    const { position, destination } = projectile;
    const dx = destination.x - position.x;
    const dy = destination.y - position.y;
    const distance = Math.hypot(dx, dy);
    if (distance > step) {
      position.x += (dx / distance) * step;
      position.y += (dy / distance) * step;
      return true;
    }

    projectile.position = { ...destination };
    hit(projectile, target, state, ctx, events);
    return false;
  });
}

function hit(
  projectile: Projectile,
  target: Enemy | undefined,
  state: SimState,
  ctx: SimContext,
  events: SimEvent[],
): void {
  const { attack, damage } = ctx.units.towers[projectile.kind]!;
  const { x, y } = projectile.position;

  let victims: Enemy[];
  if (attack.mode === 'splash') {
    events.push({
      type: 'projectileHit',
      projectileId: projectile.id,
      x,
      y,
      splashRadius: attack.radius,
    });
    victims = state.enemies.filter((e) => {
      const pose = poseAt(ctx.path, e.pathT);
      return Math.hypot(pose.x - x, pose.y - y) <= attack.radius;
    });
  } else {
    events.push({ type: 'projectileHit', projectileId: projectile.id, x, y });
    victims = target ? [target] : [];
  }

  for (const enemy of victims) damageEnemy(enemy, damage, state, ctx, events);
}

function damageEnemy(
  enemy: Enemy,
  amount: number,
  state: SimState,
  ctx: SimContext,
  events: SimEvent[],
): void {
  enemy.hp -= amount;
  events.push({ type: 'enemyDamaged', id: enemy.id, amount });
  if (enemy.hp > 0) return;

  const { reward } = ctx.units.enemies[enemy.kind]!;
  const pose = poseAt(ctx.path, enemy.pathT);
  state.gold += reward;
  state.enemies = state.enemies.filter((e) => e !== enemy);
  events.push({
    type: 'enemyKilled',
    id: enemy.id,
    kind: enemy.kind,
    reward,
    x: pose.x,
    y: pose.y,
  });
}
