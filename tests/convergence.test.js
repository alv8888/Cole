import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT,clone} from '../src/structure/design/data.js';
import {convergenceStudy,convergenceCSV,TARGETS} from '../src/structure/design/convergence.js';
test('tapered wing successive refinement keeps inputs fixed and reduces observed differences',()=>{
 const config=clone(DEFAULT),study=convergenceStudy(config);
 assert.deepEqual(config,DEFAULT);assert.deepEqual(study.rows.map(row=>row.target),TARGETS);
 assert.deepEqual(study.rows.map(row=>row.actual),TARGETS);
 const values=study.rows.map(row=>row.displacement);
 assert.ok(Math.abs(values[3]-values[2])<Math.abs(values[2]-values[1]));
 for(const row of study.rows){assert.equal(row.configuration.force,DEFAULT.force);assert.ok(Number.isFinite(row.residual));}
 assert.equal(study.rows[0].displacementChange,null);
});
test('constant-section wing and zero load do not invent approximation errors or zero-reference percentages',()=>{
 const c=clone(DEFAULT);c.wing.tip=c.wing.root;
 const study=convergenceStudy(c),u=study.rows[0].displacement;
 for(const row of study.rows)assert.ok(Math.abs(row.displacement-u)/Math.abs(u)<1e-6);
 c.force=0;const zero=convergenceStudy(c);
 for(const row of zero.rows){assert.equal(Math.abs(row.displacement),0);assert.equal(row.displacementChange,null);assert.equal(row.stressChange,null);}
});
test('rocket respects section junctions and reports actual rather than requested counts',()=>{
 const c=clone(DEFAULT);c.object='rocket';c.load='compression';
 const study=convergenceStudy(c),length=c.rocket.sections.reduce((sum,s)=>sum+s.length,0);
 for(const row of study.rows)assert.equal(row.actual,c.rocket.sections.reduce((sum,s)=>sum+Math.ceil(row.target*s.length/length),0));
 assert.equal(study.rows[0].actual,5);
});
test('sphere and invalid drafts are rejected; CSV includes five complete configurations and units',()=>{
 const c=clone(DEFAULT);assert.throws(()=>convergenceStudy({...c,object:'sphere',load:'pressure'}),/analítico/);
 c.sphere.radius=NaN;assert.throws(()=>convergenceStudy(c));
 const study=convergenceStudy(DEFAULT),csv=convergenceCSV(study);
 assert.equal(csv.split('\r\n').length,7);assert.match(csv,/maximum_stress_Pa/);assert.match(csv,/warnings_json/);
 assert.ok(csv.includes(JSON.stringify(study.rows[4].configuration).replaceAll('"','""')));
 assert.throws(()=>convergenceCSV({rows:[]}));
});
