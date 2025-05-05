import * as Scheduler from "./scheduler";

const argv = process.argv.slice( 2 );

if ( argv.length < 4 ) throw new Error( "Usage: ts-node scheduler.ts extract <wallet> <chainId> <fromBlock> <toBlock>" );

async function waitForTasks( tasks: any[] )
{
  const finalStatuses = ["STOPPED", "DEPROVISIONING"] as const;

  while ( true )
  {
    const results = await Scheduler.checkTaskStatus( tasks.map( t => t.taskArn ) );
    const pods = results.tasks || [];

    if ( !pods.length ) break;

    for ( const p of pods ) 
    {
      console.log( {
        arn: p.taskArn,
        lastStatus: p?.lastStatus,
        stoppedReason: p?.stoppedReason,
        started: p?.startedAt,
        stopping: p?.stoppingAt,
        stopped: p?.stoppedAt,
        exitCode: p?.containers?.[0].exitCode,
        reason: p?.containers?.[0].reason,
      } );
    }

    if ( pods.every( p => finalStatuses.includes( p.lastStatus as any ) ) ) break;
    console.log( `Waiting...` );
    await new Promise( resolve => setTimeout( resolve, 2000 ) );
  }
}

async function pushTasks( tasks: any[], task: any )
{
  const t = task.tasks?.[0];
  if ( !t ) throw new Error( "Failed to launch task: " + JSON.stringify( task.failures || "N/A" ) );
  tasks.push( t );
}

/** Launch extract task. */
async function launchTasks()
{
  const [wallet, chainId, fromBlock, toBlock] = argv;

  let from = Number( fromBlock ) || 0;
  const to = Number( toBlock ) || 0;

  const extractTasks: any[] = [];
  const saveTasks: any[] = [];

  while ( from < to )
  {
    console.log( `Extracting blocks ${from} - ${to}` );

    const nextTo = Math.min( from + 1000, to );

    const task = await Scheduler.launchTask( {
      task: "extract",
      wallet: wallet,
      chainId: chainId,
      fromBlock: from,
      toBlock: nextTo,
    } );

    pushTasks( extractTasks, task );

    from = nextTo;
  }

  await waitForTasks( extractTasks );

  console.log( `All extract tasks completed: count ${extractTasks.length}` );

  ////////////////////////////////////////////////////////

  const saveTask = await Scheduler.launchTask( {
    task: "save",
    wallet: wallet,
    chainId: chainId,
    fromBlock: 0,
    toBlock: 0,
  } );

  pushTasks( saveTasks, saveTask );
  await waitForTasks( saveTasks );
  console.log( `All save tasks completed: count ${saveTasks.length}` );
}


// Start the script.
launchTasks();