const connection = require('../database/connection');


module.exports = {

    async index(request, response) {

        const { page = 1 } = request.query;

        const [count] = await connection('incidents')
            .count();

        response.header('X-Total-Count', count['count(*)'])

        const incidents = await connection('incidents')
            .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
            .limit(5)
            .offset((page - 1) * 5)
            .select(
                [
                    'incidents.*', 
                    'ongs.name', 
                    'ongs.email', 
                    'ongs.whatsapp', 
                    'ongs.city',
                    'ongs.uf'
                ]
            );

        if(incidents.length < 1){
            return response.status(206).json({ page_not_found: "No results for this page number." })
        }
    
        return response.json(incidents);
    },

    async create(request, response) {
        const { title, description, value } = request.body;
        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id
        });

        return response.json({ id });
    },

    async delete(request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;

        const incident = await connection('incidents')
            .where('id', id)
            .select('ong_id')
            .first();

        if(!ong_id){
            return response.status(401)
                .json( {error: "ONG ID not found."});
        }

        if(!incident){
            return response.status(401)
                .json( {error: "Incident not found."});
        }

        if (ong_id != incident.ong_id){
            return response.status(401)
                .json( {error: "Operation denied! Cannot delete incidents from another ONG."});
        }

        await connection('incidents').where('id', id).delete();

        return response.status(204).send();
    } 
};