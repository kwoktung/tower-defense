import { towerStats } from '../../content/schemas';
import type { SimContext } from '../context';
import { poseAt } from '../path';
import { secondsToTicks, TICK_RATE } from '../time';
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

    const def = towerStats(ctx.units, projectile.kind, projectile.level)!;
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
  const { attack, damage, slow } = towerStats(ctx.units, projectile.kind, projectile.level)!;
  const { x, y } = projectile.position;

  let victims: Enemy[];
  if (attack.mode === 'splash') {
    events.push({
      type: 'projectileHit',
      projectileId: projectile.id,
      kind: projectile.kind,
      x,
      y,
      splashRadius: attack.radius,
    });
    victims = state.enemies.filter((e) => {
      const pose = poseAt(ctx.path, e.pathT);
      return Math.hypot(pose.x - x, pose.y - y) <= attack.radius;
    });
  } else {
    events.push({
      type: 'projectileHit',
      projectileId: projectile.id,
      kind: projectile.kind,
      x,
      y,
    });
    victims = target ? [target] : [];
  }

  for (const enemy of victims) {
    const survived = damageEnemy(enemy, damage, state, ctx, events);
    if (survived && slow) applySlow(enemy, slow.factor, secondsToTicks(slow.durationSec));
  }
}

/** Slows don't stack: one at least as strong replaces the current Slow and restarts it. */
function applySlow(enemy: Enemy, factor: number, ticks: number): void {
  if (enemy.slow && factor < enemy.slow.factor) return;
  enemy.slow = { factor, ticksLeft: ticks };
}

/** Share of a hit that always gets through, however high the Armor. */
const MIN_DAMAGE_SHARE = 0.2;

/** Armor reduces every hit by a flat amount, but never below MIN_DAMAGE_SHARE of it. */
function damageAfterArmor(damage: number, armor: number): number {
  return Math.max(damage - armor, damage * MIN_DAMAGE_SHARE);
}

/** Deals a hit after Armor; returns whether the enemy survived it. */
function damageEnemy(
  enemy: Enemy,
  amount: number,
  state: SimState,
  ctx: SimContext,
  events: SimEvent[],
): boolean {
  const { reward, armor } = ctx.units.enemies[enemy.kind]!;
  const dealt = damageAfterArmor(amount, armor);
  enemy.hp -= dealt;
  events.push({ type: 'enemyDamaged', id: enemy.id, amount: dealt });
  if (enemy.hp > 0) return true;

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
  return false;
}
