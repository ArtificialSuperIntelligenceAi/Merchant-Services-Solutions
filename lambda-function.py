"""
Lambda function to handle admin updates to solutions.json

This function:
- Validates the incoming JSON data
- Saves it to S3
- Returns success/error response

Python version - boto3 is included in Lambda runtime, no bundling needed!
"""

import json
import os
import boto3
from datetime import datetime

# Initialize S3 client (boto3 is pre-installed in Lambda)
s3 = boto3.client('s3')

# Get bucket and key from environment variables
DATA_BUCKET = os.environ.get('DATA_BUCKET', 'merchant-solutions-data')
DATA_KEY = os.environ.get('DATA_KEY', 'data/solutions.json')

def validate_data(data):
    """Basic JSON validation"""
    if not isinstance(data, dict):
        raise ValueError('Invalid data: must be an object')
    
    if not isinstance(data.get('categories'), list):
        raise ValueError('Invalid data: categories must be an array')
    
    if not isinstance(data.get('features'), dict):
        raise ValueError('Invalid data: features must be an object')
    
    if not isinstance(data.get('solutions'), list):
        raise ValueError('Invalid data: solutions must be an array')
    
    # Validate each solution has required fields
    for idx, sol in enumerate(data.get('solutions', [])):
        if not sol.get('id') or not sol.get('name') or not sol.get('category'):
            raise ValueError(f'Solution at index {idx} missing required fields (id, name, category)')
    
    return True

def lambda_handler(event, context):
    """Main Lambda handler"""
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',  # In production, restrict this to your domain
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS request for CORS preflight
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method') or event.get('requestContext', {}).get('httpMethod')
    
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Only allow PUT method
    if http_method != 'PUT':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed. Use PUT.'})
        }
    
    try:
        # Parse request body
        body_str = event.get('body', '{}')
        if isinstance(body_str, str):
            body = json.loads(body_str) if body_str else {}
        else:
            body = body_str
        
        if not body:
            raise ValueError('Request body is empty')
        
        # Validate the data structure
        validate_data(body)
        
        # Convert to JSON string with pretty formatting
        json_string = json.dumps(body, indent=2)
        
        # Upload to S3
        s3.put_object(
            Bucket=DATA_BUCKET,
            Key=DATA_KEY,
            Body=json_string,
            ContentType='application/json',
            CacheControl='no-cache'  # Prevent caching of old data
        )
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Data saved successfully',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            })
        }
        
    except ValueError as e:
        # Validation errors
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
    except Exception as e:
        # Other errors
        print(f'Error saving data: {str(e)}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': 'Internal server error: ' + str(e)
            })
        }

