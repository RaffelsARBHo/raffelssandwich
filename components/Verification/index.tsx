'use client';

import { SUCCESS } from '@/constants';
import gql from 'graphql-tag';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useMutation } from 'urql';

const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      status
      message
    }
  }
`;

function Verification({}) {
  const [{ fetching, data }, verifyEmail] = useMutation(VERIFY_EMAIL);
  const searchParams = useSearchParams();

  //todo: double verification
  const token = searchParams.get('token');
  useEffect(() => {
    if (token) {
      verifyEmail({ token });
    }
  }, [token, verifyEmail]);

  if (fetching) return 'Verifying...';

  if (data?.verifyEmail?.satus === SUCCESS) {
    return 'Verified';
  }

  //todo: show error if verifcation fails
  return null;
}

export default Verification;
