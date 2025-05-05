import * as Axios from "axios";

/** Get data from the specified URL. */
export async function get<T = any>( url: string ): Promise<T>
{
  if ( !url ) throw new Error( "Invalid url" );

  try
  {
    const response = await Axios.default.get<T>( url );
    return response.data;
  } catch ( error )
  {
    if ( Axios.isAxiosError( error ) )
    {
      throw new Error( `Failed to fetch data: ${error.message}` );
    }
    throw error;
  }
}
