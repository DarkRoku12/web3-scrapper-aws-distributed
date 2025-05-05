import * as Dotenv from "dotenv-flow";
import * as Hono from "hono";
import * as NodeServer from "@hono/node-server";
import * as Logger from "hono/logger";
import * as PrettyJson from "hono/pretty-json";
import * as Transactions from "./transactions";

// Load environment variables
Dotenv.config();

const app = new Hono.Hono();

// Middleware
app.use( "*", Logger.logger() );
app.use( "*", PrettyJson.prettyJSON() );

// Routes.

app.get( "/", ( c ) =>
{
  return c.json( { message: "Welcome to the external service" } );
} );

app.get( "/health", ( c ) =>
{
  return c.json( { status: "ok" } );
} );

// Example call: GET http://localhost:7010/assets/1/0xc0ffee254729296a45a3885639AC7E10F9d54979/1000/2000
app.get( "/assets/:chainId/:wallet/:blockFrom/:blockTo", ( c ) =>
{
  const { chainId, wallet } = c.req.param();
  const blockFrom = parseInt( c.req.param( "blockFrom" ), 10 );
  const blockTo = parseInt( c.req.param( "blockTo" ), 10 );

  console.log( `Request for chainId: ${chainId}, wallet: ${wallet}, blocks: ${blockFrom}-${blockTo}` );

  // Generate 1000 transactions with the specified distribution
  const trxs = Transactions.generate( {
    chainId: chainId,
    wallet: wallet,
    blockFrom: blockFrom,
    blockTo: blockTo,
    count: 1000,
  } );

  return c.json( trxs );
} );

// Error handling
app.notFound( ( c ) =>
{
  return c.json( { message: "Not Found", status: 404 }, 404 );
} );

app.onError( ( err, c ) =>
{
  console.error( `Error: ${err.message}` );
  return c.json( { message: "Internal Server Error", status: 500 }, 500 );
} );

// Start the server
const port = parseInt( process.env.PORT || "7010" );

if ( process.env.NODE_ENV != "test" )
{
  NodeServer.serve(
    {
      fetch: app.fetch,
      port,
    },
    ( info ) =>
    {
      console.log( `Server is running on http://localhost:${info.port}` );
    }
  );
}

// Export for testing purposes
export default app;